# Student Attendance Tracker

A simple, responsive web application to keep student records, mark daily attendance, check attendance percentage and find students with low attendance.

Made for: Hackathon - Fundamentals of Web Development (Level 2)
College: Voorhees College, Vellore

## Features

- Add, edit and delete student details
- Mark attendance by date: Present, Absent, Late, On Duty
- Attendance percentage is calculated automatically
- Search and filter by name, student ID, department or attendance status
- Student-wise attendance history
- Low attendance highlight with a threshold you can change (default 75%)
- Duplicate attendance for the same student on the same date is prevented
- Data is saved in the browser Local Storage
- Summary cards: total students, present, absent, overall percentage, low attendance count
- Works on laptop, tablet and mobile screens

## Technologies Used

- HTML5
- CSS3 (Grid, Flexbox, media queries)
- JavaScript (ES6, no libraries)
- Browser Local Storage

## Project Files

| File | Purpose |
| --- | --- |
| index.html | Page structure |
| style.css | Design and responsive layout |
| script.js | All the logic (students, attendance, percentage, filters, storage) |

## How to Run

1. Keep index.html, style.css and script.js in the same folder.
2. Open the folder in VS Code, right click index.html and choose Open with Live Server.
   (Or just double click index.html to open it in Chrome.)
3. Click "Load sample data" to try the app, or add your own students.

## How to Use

1. Add students using the form on the Students tab.
2. Pick the date at the top, then open the Mark Attendance tab.
3. Choose a status for each student and click Save (or "Mark all unmarked as Present").
4. Check the percentage in the Students tab. Students below the limit are shown in red with a LOW badge.
5. Open Attendance History to see all dates of one student.

## Attendance Rule

Present, Late and On Duty are counted as attended.

Percentage = (attended days / total marked days) x 100

A student is marked LOW when the percentage is below the limit set at the top of the page.

## Note

Data is stored only in the same browser on the same computer. Clearing browser data will remove it.

## Author

Gopzz - BCA student
