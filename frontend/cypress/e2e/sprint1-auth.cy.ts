/**
 * Sprint 1 Frontend E2E Tests - Cypress
 * Test all user-facing use cases from frontend perspective
 */

describe("Sprint 1 - Authentication & Session Flow", () => {
  beforeEach(() => {
    cy.visit("http://localhost:3000");
  });

  describe("UC1 - Login Flow", () => {
    it("should load login page", () => {
      cy.contains("Login").should("exist");
      cy.get('input[name="email"]').should("exist");
      cy.get('input[name="password"]').should("exist");
      cy.contains("Login").closest("button").should("exist");
    });

    it("should successfully login with valid credentials", () => {
      cy.get('input[name="email"]').type("uddinsimran@graduate.utm.my");
      cy.get('input[name="password"]').type("password@cmms");
      cy.contains("button", "Login").click();

      // Should redirect to dashboard after successful login
      cy.url().should("include", "/dashboard");
      cy.contains("Dashboard").should("exist");
    });

    it("should show error on invalid credentials", () => {
      cy.get('input[name="email"]').type("uddinsimran@graduate.utm.my");
      cy.get('input[name="password"]').type("wrongpassword");
      cy.contains("button", "Login").click();

      // Should show error message
      cy.contains("Invalid credentials", { timeout: 5000 }).should("exist");
      // Should stay on login page
      cy.url().should("include", "/login");
    });

    it("should show validation error for empty email", () => {
      cy.get('input[name="password"]').type("password@cmms");
      cy.contains("button", "Login").click();

      // Should show validation error
      cy.contains("Email is required", { timeout: 3000 }).should("exist");
    });

    it("should show validation error for empty password", () => {
      cy.get('input[name="email"]').type("uddinsimran@graduate.utm.my");
      cy.contains("button", "Login").click();

      // Should show validation error
      cy.contains("Password is required", { timeout: 3000 }).should("exist");
    });

    it("should accept @graduate.utm.my email", () => {
      cy.get('input[name="email"]').type("uddinsimran@graduate.utm.my");
      cy.get('input[name="password"]').type("password@cmms");

      // Should not show domain validation error
      cy.contains("Invalid email domain").should("not.exist");
    });

    it("should accept @utm.my email", () => {
      cy.get('input[name="email"]').type("lecturer@utm.my");
      cy.get('input[name="password"]').type("password@cmms");

      // Should not show domain validation error
      cy.contains("Invalid email domain").should("not.exist");
    });

    it("should reject invalid email format", () => {
      cy.get('input[name="email"]').type("notanemail");
      cy.get('input[name="password"]').type("password@cmms");
      cy.contains("button", "Login").click();

      // Should show format error
      cy.contains(/invalid|must be.*email/i, { timeout: 3000 }).should("exist");
    });
  });

  describe("UC2 - Forced Password Change", () => {
    it("should redirect to password change on first login", () => {
      cy.get('input[name="email"]').type("uddinsimran@graduate.utm.my");
      cy.get('input[name="password"]').type("password@cmms");
      cy.contains("button", "Login").click();

      // Should be redirected to password change screen
      cy.url().should("include", "/password-change");
      cy.contains("Change Password").should("exist");
    });

    it("should display password change form with validations", () => {
      // Login and get to password change
      cy.get('input[name="email"]').type("uddinsimran@graduate.utm.my");
      cy.get('input[name="password"]').type("password@cmms");
      cy.contains("button", "Login").click();

      cy.url().should("include", "/password-change");

      // Form fields should exist
      cy.get('input[name="oldPassword"]').should("exist");
      cy.get('input[name="newPassword"]').should("exist");
      cy.get('input[name="confirmPassword"]').should("exist");
    });

    it("should validate old password is correct", () => {
      cy.get('input[name="email"]').type("uddinsimran@graduate.utm.my");
      cy.get('input[name="password"]').type("password@cmms");
      cy.contains("button", "Login").click();

      cy.get('input[name="oldPassword"]').type("wrongoldpassword");
      cy.get('input[name="newPassword"]').type("newpassword123");
      cy.get('input[name="confirmPassword"]').type("newpassword123");
      cy.contains("button", "Change Password").click();

      // Should show error
      cy.contains(/old password.*incorrect|invalid/i, { timeout: 5000 }).should("exist");
    });

    it("should validate passwords match", () => {
      cy.get('input[name="email"]').type("uddinsimran@graduate.utm.my");
      cy.get('input[name="password"]').type("password@cmms");
      cy.contains("button", "Login").click();

      cy.get('input[name="oldPassword"]').type("password@cmms");
      cy.get('input[name="newPassword"]').type("newpassword123");
      cy.get('input[name="confirmPassword"]').type("differentpassword");
      cy.contains("button", "Change Password").click();

      // Should show error
      cy.contains(/passwords.*match|confirm.*password/i, { timeout: 3000 }).should("exist");
    });

    it("should successfully change password and redirect to dashboard", () => {
      cy.get('input[name="email"]').type("uddinsimran@graduate.utm.my");
      cy.get('input[name="password"]').type("password@cmms");
      cy.contains("button", "Login").click();

      cy.get('input[name="oldPassword"]').type("password@cmms");
      cy.get('input[name="newPassword"]').type("mynewpassword123");
      cy.get('input[name="confirmPassword"]').type("mynewpassword123");
      cy.contains("button", "Change Password").click();

      // Should redirect to dashboard
      cy.url().should("include", "/dashboard");
      cy.contains("Dashboard").should("exist");
    });
  });

  describe("UC3 - Rate Limiting", () => {
    it("should show error after multiple failed login attempts", () => {
      // Make 6 failed attempts
      for (let i = 0; i < 6; i++) {
        cy.get('input[name="email"]').type("uddinsimran@graduate.utm.my");
        cy.get('input[name="password"]').type("wrongpassword");
        cy.contains("button", "Login").click();
        cy.get('input[name="email"]').clear();
        cy.get('input[name="password"]').clear();
      }

      // On 6th attempt, should show rate limit error
      cy.contains(/too many|try again|rate limit/i, { timeout: 5000 }).should("exist");
    });

    it("should lock login button temporarily", () => {
      // This depends on frontend implementation
      // Make failed attempts
      for (let i = 0; i < 6; i++) {
        cy.get('input[name="email"]').clear().type("uddinsimran@graduate.utm.my");
        cy.get('input[name="password"]').clear().type("wrongpassword");
        cy.contains("button", "Login").click();
      }

      // Button should be disabled or show loading state
      cy.contains("button", "Login").should("be.disabled");
    });

    it("should display user-friendly error message", () => {
      for (let i = 0; i < 6; i++) {
        cy.get('input[name="email"]').clear().type("uddinsimran@graduate.utm.my");
        cy.get('input[name="password"]').clear().type("wrongpassword");
        cy.contains("button", "Login").click();
      }

      // Message should be clear and helpful
      cy.get('[role="alert"]').should("contain", "Too many");
    });
  });

  describe("UC4 - Protected Routes", () => {
    it("should redirect unauthenticated users to login", () => {
      // Try to access dashboard directly
      cy.visit("http://localhost:3000/dashboard");

      // Should redirect to login
      cy.url().should("include", "/login");
      cy.contains("Login").should("exist");
    });

    it("should allow authenticated users to access dashboard", () => {
      // Login first
      cy.get('input[name="email"]').type("uddinsimran@graduate.utm.my");
      cy.get('input[name="password"]').type("password@cmms");
      cy.contains("button", "Login").click();

      // Complete password change if required
      cy.url().then((url) => {
        if (url.includes("password-change")) {
          cy.get('input[name="oldPassword"]').type("password@cmms");
          cy.get('input[name="newPassword"]').type("mynewpassword123");
          cy.get('input[name="confirmPassword"]').type("mynewpassword123");
          cy.contains("button", "Change Password").click();
        }
      });

      // Should be on dashboard
      cy.url().should("include", "/dashboard");
      cy.contains("Dashboard").should("exist");
    });

    it("should persist session across page reloads", () => {
      // Login
      cy.get('input[name="email"]').type("uddinsimran@graduate.utm.my");
      cy.get('input[name="password"]').type("password@cmms");
      cy.contains("button", "Login").click();

      // Complete password change
      cy.url().then((url) => {
        if (url.includes("password-change")) {
          cy.get('input[name="oldPassword"]').type("password@cmms");
          cy.get('input[name="newPassword"]').type("mynewpassword123");
          cy.get('input[name="confirmPassword"]').type("mynewpassword123");
          cy.contains("button", "Change Password").click();
        }
      });

      // Reload page
      cy.reload();

      // Should still be on dashboard
      cy.url().should("include", "/dashboard");
      cy.contains("Dashboard").should("exist");
    });
  });

  describe("UC5 - Role-Based Dashboard", () => {
    it("should show student dashboard for student role", () => {
      cy.get('input[name="email"]').type("uddinsimran@graduate.utm.my");
      cy.get('input[name="password"]').type("password@cmms");
      cy.contains("button", "Login").click();

      // Complete password change
      cy.url().then((url) => {
        if (url.includes("password-change")) {
          cy.get('input[name="oldPassword"]').type("password@cmms");
          cy.get('input[name="newPassword"]').type("mynewpassword123");
          cy.get('input[name="confirmPassword"]').type("mynewpassword123");
          cy.contains("button", "Change Password").click();
        }
      });

      // Should show student-specific content
      cy.contains("Student Dashboard", { timeout: 5000 }).should("exist");
    });

    it("should show lecturer dashboard for lecturer role", () => {
      cy.get('input[name="email"]').type("khobaituddinsimran@gmail.com");
      cy.get('input[name="password"]').type("password@cmms");
      cy.contains("button", "Login").click();

      // Should show lecturer-specific content
      cy.contains(/Lecturer Dashboard|Courses|Assessments/i, { timeout: 5000 }).should("exist");
    });

    it("should not allow role switching", () => {
      cy.get('input[name="email"]').type("uddinsimran@graduate.utm.my");
      cy.get('input[name="password"]').type("password@cmms");
      cy.contains("button", "Login").click();

      // Try to manually navigate to lecturer dashboard
      cy.visit("http://localhost:3000/dashboard/lecturer");

      // Should be redirected to student dashboard
      cy.url().should("not.include", "/lecturer");
    });
  });

  describe("UC6 - Logout", () => {
    it("should logout user and clear session", () => {
      // Login
      cy.get('input[name="email"]').type("uddinsimran@graduate.utm.my");
      cy.get('input[name="password"]').type("password@cmms");
      cy.contains("button", "Login").click();

      // Complete password change
      cy.url().then((url) => {
        if (url.includes("password-change")) {
          cy.get('input[name="oldPassword"]').type("password@cmms");
          cy.get('input[name="newPassword"]').type("mynewpassword123");
          cy.get('input[name="confirmPassword"]').type("mynewpassword123");
          cy.contains("button", "Change Password").click();
        }
      });

      // Click logout
      cy.contains("button", "Logout").click();

      // Should redirect to login
      cy.url().should("include", "/login");
      cy.contains("Login").should("exist");
    });

    it("should not allow access to protected routes after logout", () => {
      // Login
      cy.get('input[name="email"]').type("uddinsimran@graduate.utm.my");
      cy.get('input[name="password"]').type("password@cmms");
      cy.contains("button", "Login").click();

      // Complete password change
      cy.url().then((url) => {
        if (url.includes("password-change")) {
          cy.get('input[name="oldPassword"]').type("password@cmms");
          cy.get('input[name="newPassword"]').type("mynewpassword123");
          cy.get('input[name="confirmPassword"]').type("mynewpassword123");
          cy.contains("button", "Change Password").click();
        }
      });

      // Logout
      cy.contains("button", "Logout").click();

      // Try to access dashboard
      cy.visit("http://localhost:3000/dashboard");

      // Should redirect to login
      cy.url().should("include", "/login");
    });
  });

  describe("UC7 - Error Toasts/Notifications", () => {
    it("should show error toast on login failure", () => {
      cy.get('input[name="email"]').type("uddinsimran@graduate.utm.my");
      cy.get('input[name="password"]').type("wrongpassword");
      cy.contains("button", "Login").click();

      // Error toast should appear
      cy.get('[role="alert"]').should("contain", "Invalid");
    });

    it("should show success toast on successful login", () => {
      cy.get('input[name="email"]').type("uddinsimran@graduate.utm.my");
      cy.get('input[name="password"]').type("password@cmms");
      cy.contains("button", "Login").click();

      // Success notification or redirect to password change
      cy.url().should("include", "/password-change").or("include", "/dashboard");
    });

    it("should close toast on dismiss", () => {
      cy.get('input[name="email"]').type("uddinsimran@graduate.utm.my");
      cy.get('input[name="password"]').type("wrongpassword");
      cy.contains("button", "Login").click();

      // Toast appears
      cy.get('[role="alert"]').should("exist");

      // Close button
      cy.get('[role="alert"]').contains("button", "close", { matchCase: false }).click();

      // Toast should be gone
      cy.get('[role="alert"]').should("not.exist");
    });
  });

  describe("UC8 - Loading States", () => {
    it("should show loading spinner while logging in", () => {
      cy.get('input[name="email"]').type("uddinsimran@graduate.utm.my");
      cy.get('input[name="password"]').type("password@cmms");

      // Click button
      const loginButton = cy.contains("button", "Login");
      loginButton.click();

      // Should show loading state (button disabled or spinner)
      loginButton.should("be.disabled");
    });

    it("should disable form inputs while processing", () => {
      cy.get('input[name="email"]').type("uddinsimran@graduate.utm.my");
      cy.get('input[name="password"]').type("password@cmms");

      // Click button
      cy.contains("button", "Login").click();

      // Form inputs should be disabled or read-only
      cy.get('input[name="email"]').should("be.disabled");
      cy.get('input[name="password"]').should("be.disabled");
    });
  });
});
