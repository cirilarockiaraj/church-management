import { gapi } from 'gapi-script';

// We require the client ID and API Key to be configured in environment variables
const CLIENT_ID = '500902128223-3g12sr0do3unibeper97jqma2l8pdce3.apps.googleusercontent.com';
const API_KEY = 'AIzaSyCd6wp3Ovo6x4pwusH_3JCHKu1qw9jcQd0';
const SPREADSHEET_ID = '1CH5wDCyKFXGGK7I0VCSXousk91fTRA07R01NN8aIy3E';

// Array of API discovery doc URLs for APIs
const DISCOVERY_DOCS = ['https://sheets.googleapis.com/$discovery/rest?version=v4'];

// Authorization scopes required by the API
const SCOPES = 'https://www.googleapis.com/auth/spreadsheets';

let tokenClient;
let initPromise = null;
const GOOGLE_AUTH_STORAGE_KEY = 'google_auth_token_data';

export const initGoogleSheetsAPI = () => {
  if (initPromise) return initPromise;

  initPromise = new Promise((resolve, reject) => {
    gapi.load('client', async () => {
      try {
        await gapi.client.init({
          apiKey: API_KEY,
          discoveryDocs: DISCOVERY_DOCS,
          plugin_name: 'ChurchManagementServerless',
        });

        // Ensure the sheets API is loaded. Sometimes init doesn't load discovery docs instantly.
        await gapi.client.load('sheets', 'v4');

        // Initialize GIS (Google Identity Services)
        const initGsi = () => {
           if (window.google && window.google.accounts) {
               tokenClient = window.google.accounts.oauth2.initTokenClient({
                   client_id: CLIENT_ID,
                   scope: SCOPES,
                   callback: '', // Overridden during requestAccessToken
               });
               
               // Check if we have a valid cached token
               const cachedAuth = localStorage.getItem(GOOGLE_AUTH_STORAGE_KEY);
               if (cachedAuth) {
                  const authData = JSON.parse(cachedAuth);
                  if (authData.expires_at > Date.now()) {
                     gapi.client.setToken({ access_token: authData.access_token });
                  } else {
                     // Token expired, clear it
                     localStorage.removeItem(GOOGLE_AUTH_STORAGE_KEY);
                  }
               }
               
               resolve(true);
           } else {
               setTimeout(initGsi, 100);
           }
        };
        initGsi();

      } catch (error) {
        console.error('Error initializing gapi', error);
        initPromise = null;
        reject(error);
      }
    });
  });

  return initPromise;
};

export const signInToGoogle = () => {
  return new Promise((resolve, reject) => {
     if (!tokenClient) {
         return reject(new Error('Google Identity Services not initialized'));
     }
     
     tokenClient.callback = (resp) => {
        if (resp.error !== undefined) {
           reject(resp);
        } else {
           gapi.client.setToken({ access_token: resp.access_token });
           // Save to local storage for persistence
           const expiresIn = resp.expires_in || 3600; // defaults to 1 hour
           const expiresAt = Date.now() + (expiresIn * 1000);
           localStorage.setItem(GOOGLE_AUTH_STORAGE_KEY, JSON.stringify({
              access_token: resp.access_token,
              expires_at: expiresAt
           }));
           resolve(true);
        }
     };

     if (gapi.client.getToken() === null) {
         tokenClient.requestAccessToken({ prompt: 'consent' });
     } else {
         tokenClient.requestAccessToken({ prompt: '' });
     }
  });
};

export const signOutFromGoogle = () => {
    const token = gapi.client.getToken();
    if (token !== null) {
      window.google.accounts.oauth2.revoke(token.access_token);
      gapi.client.setToken('');
    }
    localStorage.removeItem(GOOGLE_AUTH_STORAGE_KEY);
};

export const checkIsSignedIn = () => {
  const token = gapi.client.getToken();
  if (token && token.access_token) return true;
  
  // Check local storage just in case gapi token isn't set yet but we have it cached
  const cachedAuth = localStorage.getItem(GOOGLE_AUTH_STORAGE_KEY);
  if (cachedAuth) {
      const authData = JSON.parse(cachedAuth);
      if (authData.expires_at > Date.now()) {
          return true;
      }
  }
  return false;
};

/**
 * Validates credentials by checking the spreadsheet
 * Note: the prompt requested a simple logic: fetch rows from Credentials sheet
 */
export const getSpreadsheetData = async (range) => {
  try {
    await initGoogleSheetsAPI();
    const response = await gapi.client.sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: range,
    });
    return response.result.values;
    } catch (error) {
    if (error.status === 401 || error.status === 403) {
      localStorage.removeItem(GOOGLE_AUTH_STORAGE_KEY); // clear invalid token
      gapi.client.setToken(''); // clear from memory
      await signInToGoogle();
      return getSpreadsheetData(range); // Retry after sign in
    }
    console.error(`Error reading data from ${range}`, error);
    throw error;
  }
};

export const appendSpreadsheetRow = async (range, values) => {
  try {
    await initGoogleSheetsAPI();
    if (!checkIsSignedIn()) {
        await signInToGoogle();
    }
    const response = await gapi.client.sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: range,
      valueInputOption: 'USER_ENTERED',
      insertDataOption: 'INSERT_ROWS',
      resource: {
        values: [values]
      }
    });
    return response.result;
  } catch (error) {
    if (error.status === 401 || error.status === 403) {
        localStorage.removeItem(GOOGLE_AUTH_STORAGE_KEY);
        gapi.client.setToken('');
        await signInToGoogle();
        return appendSpreadsheetRow(range, values); // Retry once after sign in
    }
    console.error(`Error appending data to ${range}`, error);
    throw error;
  }
};

export const updateSpreadsheetRow = async (range, values) => {
  try {
    await initGoogleSheetsAPI();
    if (!checkIsSignedIn()) {
        await signInToGoogle();
    }
    const response = await gapi.client.sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: range,
      valueInputOption: 'USER_ENTERED',
      resource: {
        values: [values]
      }
    });
    return response.result;
  } catch (error) {
    if (error.status === 401 || error.status === 403) {
        localStorage.removeItem(GOOGLE_AUTH_STORAGE_KEY);
        gapi.client.setToken('');
        await signInToGoogle();
        return updateSpreadsheetRow(range, values); // Retry once after sign in
    }
    console.error(`Error updating data at ${range}`, error);
    throw error;
  }
};

// Internal helper to get sheetId by sheetName
const getSheetIdByName = async (sheetName) => {
  const response = await gapi.client.sheets.spreadsheets.get({
    spreadsheetId: SPREADSHEET_ID,
  });
  
  const sheet = response.result.sheets.find(s => s.properties.title === sheetName);
  if (!sheet) {
    throw new Error(`Sheet name ${sheetName} not found`);
  }
  return sheet.properties.sheetId;
};

// Use this conceptually if deleting rows or clearing records
export const clearSpreadsheetRow = async (range) => {
  try {
    await initGoogleSheetsAPI();
    if (!checkIsSignedIn()) {
        await signInToGoogle();
    }
     const response = await gapi.client.sheets.spreadsheets.values.clear({
        spreadsheetId: SPREADSHEET_ID,
        range: range,
     });
     return response.result;
  } catch (error) {
      if (error.status === 401 || error.status === 403) {
        localStorage.removeItem(GOOGLE_AUTH_STORAGE_KEY);
        gapi.client.setToken('');
        await signInToGoogle();
        return clearSpreadsheetRow(range); // Retry once after sign in
      }
      console.error(`Error clearing data at ${range}`, error);
      throw error;
  }
};

export const deleteSpreadsheetRow = async (sheetName, rowIndex) => {
  try {
    await initGoogleSheetsAPI();
    if (!checkIsSignedIn()) {
        await signInToGoogle();
    }
    
    const sheetId = await getSheetIdByName(sheetName);
    
    const response = await gapi.client.sheets.spreadsheets.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      resource: {
        requests: [
          {
            deleteDimension: {
              range: {
                sheetId: sheetId,
                dimension: 'ROWS',
                startIndex: rowIndex - 1, // 0-based index
                endIndex: rowIndex
              }
            }
          }
        ]
      }
    });
    
    return response.result;
  } catch (error) {
    if (error.status === 401 || error.status === 403) {
        localStorage.removeItem(GOOGLE_AUTH_STORAGE_KEY);
        gapi.client.setToken('');
        await signInToGoogle();
        return deleteSpreadsheetRow(sheetName, rowIndex); // Retry once after sign in
    }
    console.error(`Error deleting row ${rowIndex} from ${sheetName}`, error);
    throw error;
  }
};
