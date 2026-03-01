import { getSpreadsheetData } from '../services/googleSheetsService';

// We fetch from the 'Credentials' sheet
// Assumes Columns: Username | Password | Role | Status

export const loginUser = async (username, password) => {
  try {
    const data = await getSpreadsheetData('Credentials!A2:D');
    
    if (!data || data.length === 0) {
      throw new Error('No users found in database');
    }

    const user = data.find(row => row[0] === username && atob(row[1]) === password);
    
    if (!user) {
      throw new Error('Invalid username or password');
    }

    if (user[3] !== 'Active') {
      throw new Error('User account is inactive');
    }

    return {
      username: user[0],
      role: user[2]
    };

  } catch (error) {
    throw error;
  }
};
