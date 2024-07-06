const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function insertStatuses() {
	// Insert statuses with IDs 1, 2, and 3 if they don't exist
	await prisma.$executeRaw`
  INSERT INTO Status (id, name) SELECT 1, "In Progress" WHERE NOT EXISTS (SELECT 1 FROM Status WHERE id = 1);
  INSERT INTO Status (id, name) SELECT 2, "Completed (Ready for review)" WHERE NOT EXISTS (SELECT 1 FROM Status WHERE id = 2);
  INSERT INTO Status (id, name) SELECT 3, "Completed and closed" WHERE NOT EXISTS (SELECT 1 FROM Status WHERE id = 3);
  INSERT INTO Status (id, name) SELECT 4, "Cancelled" WHERE NOT EXISTS (SELECT 1 FROM Status WHERE id = 4);
  `;
}

async function insertDummyTasks() {
	const result = await prisma.$executeRaw`
    INSERT INTO Task (title, description, statusId, updatedAt, dueDate)
    VALUES 
    ("Implement user authentication system with JWT", "Add user authentication using JSON Web Tokens (JWT). This will involve setting up the authentication middleware, creating the sign in and sign up routes, and testing the authentication system thoroughly.", 1, "2022-01-02T00:00:00Z", "2024-07-05T00:00:00Z"),
    ("Design and create a comprehensive database schema", "Design and implement the database schema for the application. This will involve creating tables for users, tasks, comments, and changes, and setting up the necessary relations between these tables.", 2, "2022-01-04T00:00:00Z", "2024-07-05T00:00:00Z"),
    ("Set up a robust continuous integration pipeline", "Set up a continuous integration (CI) pipeline using GitHub Actions. This will involve creating a workflow file, setting up the necessary actions, and testing the CI pipeline.", 3, "2022-01-06T00:00:00Z", "2024-07-05T00:00:00Z"),
    ("Write comprehensive unit tests for the user service", "Write unit tests for the user service. This will involve writing tests for all the functions in the user service, ensuring that all edge cases are covered, and setting up a test database.", 1, "2022-01-08T00:00:00Z", "2024-07-05T00:00:00Z"),
    ("Fix the critical bug causing user registration to fail", "Fix the bug causing user registration to fail. This will involve debugging the registration route, identifying the cause of the bug, fixing the bug, and testing the registration route thoroughly.", 2, "2022-01-10T00:00:00Z", "2024-07-05T00:00:00Z"),
    ("Optimize the website for better performance and user experience", "Optimize the website for better performance. This will involve analyzing the website's performance, identifying areas for improvement, implementing the necessary optimizations, and testing the website's performance.", 3, "2022-01-12T00:00:00Z", "2024-07-05T00:00:00Z"),
    ("Update all outdated dependencies to their latest versions", "Update all outdated dependencies to their latest versions. This will involve identifying the outdated dependencies, updating them, and testing the application thoroughly to ensure that nothing breaks.", 1, "2022-01-14T00:00:00Z", "2024-07-05T00:00:00Z"),
    ("Refactor the code in the user service for better readability and maintainability", "Refactor the code in the user service for better readability and maintainability. This will involve rewriting the code to follow best practices, adding comments, and testing the user service.", 2, "2022-01-16T00:00:00Z", "2024-07-05T00:00:00Z"),
    ("Create a comprehensive user profile page", "Create a user profile page where users can update their details. This will involve designing the user profile page, implementing the necessary routes and functions, and testing the user profile page.", 3, "2022-01-18T00:00:00Z", "2024-07-05T00:00:00Z"),
    ("Fix the critical security vulnerability in the password reset feature", "Fix the security vulnerability in the password reset feature. This will involve identifying the vulnerability, fixing it, and testing the password reset feature thoroughly.", 1, "2022-01-20T00:00:00Z", "2024-07-05T00:00:00Z"),
    ("Create comprehensive and detailed API documentation", "Create comprehensive API documentation. This will involve documenting all the routes, their parameters, their responses, and any errors they might throw.", 2, "2022-01-22T00:00:00Z", "2024-07-05T00:00:00Z"),
    ("Improve error handling in the application for better debugging", "Improve error handling in the application. This will involve setting up a global error handler, creating custom error classes, and testing the error handling.", 3, "2022-01-24T00:00:00Z", "2024-07-05T00:00:00Z"),
    ("Add comprehensive logging to the application", "Add logging to the application for better debugging. This will involve setting up a logging library, adding logs throughout the application, and testing the logging.", 1, "2022-01-26T00:00:00Z", "2024-07-05T00:00:00Z"),
    ("Implement a secure password reset feature", "Implement a feature for users to reset their password. This will involve creating the password reset route, sending the password reset email, and testing the password reset feature.", 2, "2022-01-28T00:00:00Z", "2024-07-05T00:00:00Z"),
    ("Optimize the database queries for better performance", "Optimize the database queries for better performance. This will involve analyzing the performance of the queries, identifying slow queries, optimizing them, and testing the queries.", 3, "2022-01-30T00:00:00Z", "2024-07-05T00:00:00Z"),
    ("Add pagination to the user list page for better usability", "Add pagination to the user list page. This will involve modifying the user list route to support pagination, adding the pagination controls to the user list page, and testing the pagination.", 1, "2022-02-01T00:00:00Z", "2024-07-05T00:00:00Z"),
    ("Fix the UI inconsistencies in the application for a better user experience", "Fix the UI inconsistencies in the application. This will involve identifying the inconsistencies, fixing them, and testing the UI.", 2, "2022-02-03T00:00:00Z", "2024-07-05T00:00:00Z"),
    ("Implement user roles and permissions for better access control", "Implement user roles and permissions for better access control. This will involve creating the roles and permissions, assigning them to users, and testing the access control.", 3, "2022-02-05T00:00:00Z", "2024-07-05T00:00:00Z"),
    ("Fix the critical bug causing email notifications to fail", "Fix the bug causing email notifications to fail. This will involve debugging the email notification system, identifying the cause of the bug, fixing the bug, and testing the email notification system.", 1, "2022-02-07T00:00:00Z", "2024-07-05T00:00:00Z"),
    ("Add comprehensive search functionality to the user list page", "Add search functionality to the user list page. This will involve modifying the user list route to support search, adding the search controls to the user list page, and testing the search functionality.", 2, "2022-02-09T00:00:00Z", "2024-07-05T00:00:00Z");
  `;

	console.log(result);
}
async function main() {
	// await insertStatuses();
	await insertDummyTasks();
}

main();
