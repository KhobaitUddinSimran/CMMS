"""Assessment endpoints - Supabase HTTP Client"""
import logging
from fastapi import APIRouter, Depends, HTTPException, status, Query
from pydantic import BaseModel
from ..core.config import supabase
from ..dependencies.auth import get_current_user, has_effective_role
from typing import Optional

# Use prefix to avoid path duplication issues
router = APIRouter(prefix="/api/courses", tags=["assessments"])
logger = logging.getLogger(__name__)

# Request models
class AssessmentCreate(BaseModel):
    name: str
    type: str
    max_score: float
    weight: float

class AssessmentUpdate(BaseModel):
    name: Optional[str] = None
    type: Optional[str] = None
    max_score: Optional[float] = None
    weight: Optional[float] = None

@router.post("/{course_id}/assessments", status_code=status.HTTP_201_CREATED)
async def create_assessment(
    course_id: str,
    data: AssessmentCreate,
    current_user = Depends(get_current_user),
):
    """Create a new assessment - requires lecturer or admin role"""
    
    # Validate user info structure
    if not current_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not authenticated"
        )
    
    user_id = current_user.get("user_id")
    user_role = current_user.get("role")
    
    if not user_id or not user_role:
        logger.error(f"Invalid user structure from get_current_user: {current_user}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid user information in token"
        )
    
    logger.info(f"Create assessment request - Course: {course_id}, User ID: {user_id}, Role: {user_role}")
    
    if not has_effective_role(current_user, "lecturer", "coordinator", "admin"):
        logger.warning(f"Unauthorized assessment creation - Expected lecturer/coordinator/admin, got: {user_role} + {current_user.get('special_roles')}")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Only lecturers, coordinators, and admins can create assessments. Your role: {user_role}"
        )
    
    try:
        # Verify course exists
        logger.info(f"Checking if course {course_id} exists...")
        try:
            course_response = supabase.table("courses").select("*").eq("id", course_id).execute()
            logger.info(f"Course query response type: {type(course_response)}, has data: {hasattr(course_response, 'data')}")
            logger.info(f"Course query response: {course_response}")
        except Exception as e:
            logger.error(f"Error querying courses table: {type(e).__name__}: {str(e)}", exc_info=True)
            raise
        
        if not course_response.data:
            logger.warning(f"Course {course_id} not found - response.data is empty")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Course not found"
            )
        
        course = course_response.data[0]
        assigned_lecturer_id = course.get("lecturer_id")
        
        logger.info(f"Course found - Assigned to lecturer: {assigned_lecturer_id}, Current user: {user_id}")
        
        # Verify lecturer is assigned to this course
        if user_role == "lecturer" and assigned_lecturer_id != user_id:
            logger.warning(f"Lecturer {user_id} not assigned to course {course_id} (assigned to {assigned_lecturer_id})")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"You are not assigned to this course. Course is assigned to {assigned_lecturer_id}, but you are {user_id}"
            )
        
        # Get existing assessments to calculate total weight
        logger.info(f"Getting existing assessments for course {course_id}...")
        try:
            existing_assessments = supabase.table("assessments").select("weight_percentage").eq("course_id", course_id).execute()
            logger.info(f"Existing assessments response: {existing_assessments}")
        except Exception as e:
            logger.error(f"Error querying assessments table: {type(e).__name__}: {str(e)}", exc_info=True)
            raise
            
        existing_weight = sum([a.get("weight_percentage", 0) for a in existing_assessments.data]) if existing_assessments.data else 0
        logger.info(f"Existing weight: {existing_weight}%, Adding: {data.weight}%")
        
        # Check cumulative weight
        if existing_weight + data.weight > 100:
            raise HTTPException(
                status_code=422,
                detail=f"Total assessment weight would exceed 100%. Current: {existing_weight}%, Adding: {data.weight}%"
            )
        
        # Create assessment
        new_assessment = {
            "course_id": course_id,
            "name": data.name,
            "type": data.type,
            "max_score": data.max_score,
            "weight_percentage": data.weight,
            "is_locked": False
        }
        logger.info(f"Creating assessment with data: {new_assessment}")
        
        try:
            response = supabase.table("assessments").insert(new_assessment).execute()
            logger.info(f"Insert response type: {type(response)}, has data: {hasattr(response, 'data')}")
            logger.info(f"Insert response: {response}")
            logger.info(f"Insert response data: {response.data if response else 'None'}")
        except Exception as e:
            logger.error(f"Error inserting assessment: {type(e).__name__}: {str(e)}", exc_info=True)
            raise
        
        if not response.data:
            logger.error("No data returned from insert")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create assessment - insert returned no data"
            )
        
        logger.info(f"Assessment created successfully - ID: {response.data[0].get('id')}")
        return response.data[0]
    
    except HTTPException:
        raise
    except Exception as e:
        error_msg = f"Error creating assessment for course {course_id}: {type(e).__name__}: {str(e)}"
        logger.error(error_msg, exc_info=True)
        import traceback
        logger.error(f"Traceback: {traceback.format_exc()}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create assessment"
        )

@router.get("/{course_id}/assessments")
async def list_course_assessments(
    course_id: str,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    current_user = Depends(get_current_user),
):
    """List assessments for a course"""
    try:
        # Verify course exists
        course_response = supabase.table("courses").select("*").eq("id", course_id).execute()
        if not course_response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Course not found"
            )
        
        # Get assessments
        response = supabase.table("assessments").select("*").eq("course_id", course_id).range(skip, skip + limit - 1).execute()
        assessments = response.data if response.data else []
        
        # Get total count
        count_response = supabase.table("assessments").select("id", count="exact").eq("course_id", course_id).execute()
        total = count_response.count if hasattr(count_response, "count") else len(assessments)
        
        return {
            "data": assessments,
            "total": total,
            "skip": skip,
            "limit": limit,
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching assessments for course {course_id}: {type(e).__name__}: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch assessments"
        )

@router.put("/{course_id}/assessments/{assessment_id}")
async def update_assessment(
    course_id: str,
    assessment_id: str,
    data: AssessmentUpdate,
    current_user = Depends(get_current_user),
):
    """Update an assessment - requires lecturer or admin role"""
    if not has_effective_role(current_user, "lecturer", "coordinator", "admin"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only lecturers and admins can update assessments"
        )
    
    try:
        # Get assessment
        assessment_response = supabase.table("assessments").select("*").eq("id", assessment_id).execute()
        if not assessment_response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Assessment not found"
            )
        
        assessment = assessment_response.data[0]
        
        # Verify course exists
        course_response = supabase.table("courses").select("*").eq("id", course_id).execute()
        if not course_response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Course not found"
            )
        
        course = course_response.data[0]
        
        # Verify lecturer is assigned to the course
        if current_user.get("role") == "lecturer" and course.get("lecturer_id") != current_user.get("user_id"):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You are not assigned to this course"
            )
        
        # Prepare update data
        update_data = {}
        if data.name is not None:
            update_data["name"] = data.name
        if data.type is not None:
            update_data["type"] = data.type
        if data.max_score is not None:
            update_data["max_score"] = data.max_score
        if data.weight is not None:
            # Check weight constraint
            existing_assessments = supabase.table("assessments").select("weight_percentage").eq("course_id", course_id).neq("id", assessment_id).execute()
            existing_weight = sum([a.get("weight_percentage", 0) for a in existing_assessments.data]) if existing_assessments.data else 0
            
            if existing_weight + data.weight > 100:
                raise HTTPException(
                    status_code=422,
                    detail=f"Total assessment weight would exceed 100%. Other assessments: {existing_weight}%, This assessment: {data.weight}%"
                )
            
            update_data["weight_percentage"] = data.weight
        
        # Update assessment
        response = supabase.table("assessments").update(update_data).eq("id", assessment_id).execute()
        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to update assessment"
            )
        
        return response.data[0]
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating assessment {assessment_id}: {type(e).__name__}: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update assessment"
        )

@router.delete("/{course_id}/assessments/{assessment_id}")
async def delete_assessment(
    course_id: str,
    assessment_id: str,
    current_user = Depends(get_current_user),
):
    """Delete an assessment - requires lecturer, coordinator, or admin role"""
    user_id = current_user.get("user_id")
    user_role = current_user.get("role")
    
    if not has_effective_role(current_user, "lecturer", "coordinator", "admin"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only lecturers and admins can delete assessments"
        )
    
    try:
        # Verify course exists and user is assigned
        course_response = supabase.table("courses").select("*").eq("id", course_id).execute()
        if not course_response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Course not found"
            )
        
        course = course_response.data[0]
        assigned_lecturer_id = course.get("lecturer_id")
        
        # Verify lecturer is assigned to this course (if not admin)
        if user_role == "lecturer" and assigned_lecturer_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You are not assigned to this course"
            )
        
        # Get assessment to verify it belongs to this course
        assessment_response = supabase.table("assessments").select("*").eq("id", assessment_id).execute()
        if not assessment_response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Assessment not found"
            )
        
        assessment = assessment_response.data[0]
        if assessment.get("course_id") != course_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Assessment does not belong to this course"
            )
        
        # Delete assessment
        logger.info(f"Deleting assessment {assessment_id} from course {course_id} by user {user_id}")
        response = supabase.table("assessments").delete().eq("id", assessment_id).execute()
        logger.info(f"Assessment {assessment_id} deleted successfully")
        
        return {"message": "Assessment deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting assessment {assessment_id}: {type(e).__name__}: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete assessment"
        )


@router.post("/{course_id}/assessments/lock")
async def lock_assessment_schema(
    course_id: str,
    current_user=Depends(get_current_user),
):
    """Lock all assessments for a course - prevents further schema changes.
    Requires lecturer (assigned) or admin role."""
    user_role = current_user.get("role")
    user_id = current_user.get("user_id")

    if not has_effective_role(current_user, "lecturer", "coordinator", "admin"):
        raise HTTPException(status_code=403, detail="Only lecturers, coordinators, and admins can lock schemas")

    try:
        # Verify course
        course_resp = supabase.table("courses").select("*").eq("id", course_id).execute()
        if not course_resp.data:
            raise HTTPException(status_code=404, detail="Course not found")

        course = course_resp.data[0]
        if user_role == "lecturer" and course.get("lecturer_id") != user_id:
            raise HTTPException(status_code=403, detail="You are not assigned to this course")

        # Check cumulative weight equals 100%
        assessments_resp = supabase.table("assessments").select("weight_percentage").eq("course_id", course_id).execute()
        assessments = assessments_resp.data or []
        total_weight = sum(a.get("weight_percentage", 0) for a in assessments)

        if not assessments:
            raise HTTPException(status_code=400, detail="No assessments to lock")

        if total_weight != 100:
            raise HTTPException(
                status_code=422,
                detail=f"Total weight must equal 100% before locking. Current total: {total_weight}%"
            )

        # Lock all assessments
        supabase.table("assessments").update({"is_locked": True}).eq("course_id", course_id).execute()

        logger.info(f"Assessment schema locked for course {course_id} by user {user_id}")
        return {"message": "Assessment schema locked successfully", "total_weight": total_weight}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error locking schema for course {course_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to lock assessment schema")
