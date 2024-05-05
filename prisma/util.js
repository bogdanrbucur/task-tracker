const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function insertDummyTasks() {
	const result = await prisma.$executeRaw`
    INSERT INTO Task (title, description, statusId, updatedAt)
    VALUES 
    ('Implement user authentication', 'Add user authentication using JWT', 1, '2022-01-02T00:00:00Z'),
    ('Create database schema', 'Design and implement the database schema for the application', 2, '2022-01-04T00:00:00Z'),
    ('Set up continuous integration', 'Set up CI pipeline using GitHub Actions', 3, '2022-01-06T00:00:00Z'),
    ('Write unit tests', 'Write unit tests for the user service', 1, '2022-01-08T00:00:00Z'),
    ('Fix bug in user registration', 'Fix the bug causing user registration to fail', 2, '2022-01-10T00:00:00Z'),
    ('Improve website performance', 'Optimize the website for better performance', 3, '2022-01-12T00:00:00Z'),
    ('Update dependencies', 'Update all outdated dependencies', 1, '2022-01-14T00:00:00Z'),
    ('Refactor code', 'Refactor the code in the user service for better readability', 2, '2022-01-16T00:00:00Z'),
    ('Implement user profile page', 'Create a user profile page where users can update their details', 3, '2022-01-18T00:00:00Z'),
    ('Fix security vulnerability', 'Fix the security vulnerability in the password reset feature', 1, '2022-01-20T00:00:00Z'),
    ('Create API documentation', 'Create comprehensive API documentation', 2, '2022-01-22T00:00:00Z'),
    ('Improve error handling', 'Improve error handling in the application', 3, '2022-01-24T00:00:00Z'),
    ('Add logging', 'Add logging to the application for better debugging', 1, '2022-01-26T00:00:00Z'),
    ('Implement password reset feature', 'Implement a feature for users to reset their password', 2, '2022-01-28T00:00:00Z'),
    ('Optimize database queries', 'Optimize the database queries for better performance', 3, '2022-01-30T00:00:00Z'),
    ('Add pagination to user list', 'Add pagination to the user list page', 1, '2022-02-01T00:00:00Z'),
    ('Fix UI inconsistencies', 'Fix the UI inconsistencies in the application', 2, '2022-02-03T00:00:00Z'),
    ('Implement user roles and permissions', 'Implement user roles and permissions for better access control', 3, '2022-02-05T00:00:00Z'),
    ('Fix bug in email notifications', 'Fix the bug causing email notifications to fail', 1, '2022-02-07T00:00:00Z'),
    ('Add search functionality', 'Add search functionality to the user list page', 2, '2022-02-09T00:00:00Z');
  `;

	console.log(result);
}

insertDummyTasks();
