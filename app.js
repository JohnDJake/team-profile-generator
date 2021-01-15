const Employee = require("./lib/Employee");
const Manager = require("./lib/Manager");
const Engineer = require("./lib/Engineer");
const Intern = require("./lib/Intern");
const inquirer = require("inquirer");
const path = require("path");
const fs = require("fs");
const { promisify } = require("util");
const writePromise = promisify(fs.writeFile);
const mkdirPromise = promisify(fs.mkdir);

const emailRegex = new RegExp(/^\S+@[^@\s]+\.[^@\s]+$/);
const githubRegex = new RegExp(/^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i);

const OUTPUT_DIR = path.resolve(__dirname, "output");
const outputPath = path.join(OUTPUT_DIR, "team.html");

const render = require("./lib/htmlRenderer");


// Write code to use inquirer to gather information about the development team members,
// and to create objects for each team member (using the correct classes as blueprints!)

// After the user has input all employees desired, call the `render` function (required
// above) and pass in an array containing all employee objects; the `render` function will
// generate and return a block of HTML including templated divs for each employee!

// After you have your html, you're now ready to create an HTML file using the HTML
// returned from the `render` function. Now write it to a file named `team.html` in the
// `output` folder. You can use the variable `outputPath` above target this location.
// Hint: you may need to check if the `output` folder exists and create it if it
// does not.

// HINT: each employee type (manager, engineer, or intern) has slightly different
// information; write your code to ask different questions via inquirer depending on
// employee type.

// HINT: make sure to build out your classes first! Remember that your Manager, Engineer,
// and Intern classes should all extend from a class named Employee; see the directions
// for further information. Be sure to test out each class and verify it generates an
// object with the correct structure and methods. This structure will be crucial in order
// for the provided `render` function to work! ```


async function promptUser() {
    // array for all of the team members
    const teamMembers = [];

    // ask about the manager and team size
    const { managerName, managerId, managerEmail, officeNumber, teamCount } = await inquirer.prompt([{
        type: "input",
        name: "managerName",
        message: "What is the team manager's name?",
        validate: input => input === "" ? "Please enter a name" : true
    }, {
        type: "number",
        name: "managerId",
        message: ({ managerName }) => `What is ${managerName}'s employee ID?`,
        filter: input => isNaN(input) ? "" : input,
        validate: input => input === "" || isNaN(input) ? "Please enter an ID number" : true
    }, {
        type: "input",
        name: "managerEmail",
        message: ({ managerName }) => `What is ${managerName}'s email address?`,
        filter: input => input.trim(),
        validate: input => emailRegex.test(input) ? true : "Please enter a valid email"
    }, {
        type: "number",
        name: "officeNumber",
        message: ({ managerName }) => `What is ${managerName}'s team's office number?`,
        filter: input => isNaN(input) ? "" : input,
        validate: input => input === "" || isNaN(input) ? "Please enter an office number" : true
    }, {
        type: "number",
        name: "teamCount",
        message: ({ managerName }) => `How many employees are on ${managerName}'s team?`,
        filter: input => isNaN(input) ? "" : input,
        validate: input => input === "" || isNaN(input) || input < 0 ? "Please enter a number" : true
    }]);
    teamMembers.push(new Manager(managerName, managerId, managerEmail, officeNumber));

    // ask about the other employees
    for (let i = 0; i < teamCount; i++) {
        // ask about the next employee
        const { employeeName, employeeRole, employeeId, employeeEmail, employeeGithub, employeeSchool } = await inquirer.prompt([{
            type: "input",
            name: "employeeName",
            message: "What is the next employee's name?",
            validate: input => input === "" ? "Please enter a name" : true
        }, {
            type: "list",
            name: "employeeRole",
            message: ({ employeeName }) => `What is ${employeeName}'s role on the team?`,
            choices: ["Engineer", "Intern"]
        }, {
            type: "number",
            name: "employeeId",
            message: ({ employeeName }) => `What is ${employeeName}'s employee ID?`,
            filter: input => isNaN(input) ? "" : input,
            validate: input => input === "" || isNaN(input) ? "Please enter an ID number" : true
        }, {
            type: "input",
            name: "employeeEmail",
            message: ({ employeeName }) => `What is ${employeeName}'s email address?`,
            filter: input => input.trim(),
            validate: input => emailRegex.test(input) ? true : "Please enter a valid email"
        }, {
            type: "input",
            name: "employeeGithub",
            message: ({ employeeName }) => `What is ${employeeName}'s GitHub username?`,
            validate: input => githubRegex.test(input) ? true : "Please enter a valid GitHub username",
            when: ({ employeeRole }) => employeeRole === "Engineer"
        }, {
            type: "input",
            name: "employeeSchool",
            message: ({ employeeName }) => `Where does ${employeeName} go to school?`,
            validate: input => input === "" ? "Please enter a school name" : true,
            when: ({ employeeRole }) => employeeRole === "Intern"
        }]);

        // set Role to the appropriate class
        let Role = Employee;
        switch (employeeRole) {
            case "Engineer":
                Role = Engineer;
                break;
            case "Intern":
                Role = Intern;
                break;
        }

        // add this employee to the array
        teamMembers.push(new Role(employeeName, employeeId, employeeEmail, employeeGithub || employeeSchool));
    }

    return teamMembers;
}

async function run() {
    try {
        const teamMembers = promptUser();

        let mkdir;
        if (!fs.existsSync(OUTPUT_DIR)) {
            mkdir = mkdirPromise(OUTPUT_DIR);
        }

        const html = render(await teamMembers);

        await mkdir;
        await writePromise(outputPath, html);
    } catch (err) {
        console.error(err);
    }
}

run();