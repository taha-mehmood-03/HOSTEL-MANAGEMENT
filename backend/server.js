// server.js

const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8000;

let db;

(async () => {
  try {
    db = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: 3306,
    });
    console.log('Connected to database');
  } catch (err) {
    console.error('Error connecting to database:', err);
  }
})();

app.use(express.json());
app.use(cors());
app.use(helmet());

function generateEndpoints(tableName, idColumn) {
  app.get(`/api/${tableName}`, async (req, res) => {
    try {
      const [rows] = await db.query(`SELECT * FROM ${tableName}`);
      res.json(rows);
    } catch (err) {
      console.error('Error running query:', err);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });

  app.post(`/api/${tableName}`, async (req, res) => {
    const columns = Object.keys(req.body).join(',');
    const values = Object.values(req.body);
    try {
      await db.query(`INSERT INTO ${tableName} (${columns}) VALUES (?)`, [values]);
      res.json({ message: `${tableName} inserted successfully` });
    } catch (err) {
      console.error('Error running query:', err);
      res.status(500).json({ error: `Error inserting ${tableName}` });
    }
  });

  app.put(`/api/${tableName}/:${idColumn}`, async (req, res) => {
    const idValue = req.params[idColumn];
    const columnsToUpdate = Object.keys(req.body);
    const valuesToUpdate = Object.values(req.body);
    try {
      const updateValues = columnsToUpdate.map(column => `${column} = ?`).join(',');
      await db.query(`UPDATE ${tableName} SET ${updateValues} WHERE ${idColumn} = ?`, [...valuesToUpdate, idValue]);
      res.json({ message: `${tableName} updated successfully` });
    } catch (err) {
      console.error('Error running query:', err);
      res.status(500).json({ error: `Error updating ${tableName}` });
    }
  });

  app.delete(`/api/${tableName}/:${idColumn}`, async (req, res) => {
    const idValue = req.params[idColumn];
    try {
      const [result] = await db.query(`DELETE FROM ${tableName} WHERE ${idColumn} = ?`, [idValue]);
      if (result.affectedRows === 0) {
        res.status(404).json({ error: `${tableName} not found` });
      } else {
        res.json({ message: `${tableName} deleted successfully` });
      }
    } catch (err) {
      console.error('Error running query:', err);
      res.status(500).json({ error: `Error deleting ${tableName}`, details: err.message });
    }
  });
}

// Generate endpoints for the specified tables
generateEndpoints('Attendance', 'Attendence_Id');
generateEndpoints('Hostel', 'Hostel_Name');
generateEndpoints('Mess_Staff', 'Employee_Id');
generateEndpoints('Room', 'Room_no');
generateEndpoints('Student', 'Reg_No'); // Change to 'Student' if table name is singular

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
