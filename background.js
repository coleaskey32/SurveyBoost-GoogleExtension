chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
  if (request.action === 'surveyJunkie_login') {
    try {
      const newTab = await chrome.tabs.create({
        url: 'https://app.surveyjunkie.com/public/signin',
      });

      chrome.tabs.onUpdated.addListener(function onUpdated(tabId, changeInfo) {
        if (tabId === newTab.id && changeInfo.status === 'complete') {
          chrome.tabs.onUpdated.removeListener(onUpdated);

          chrome.scripting
            .executeScript({
              target: { tabId: newTab.id },
              func: executeLogin,
              args: [request.email, request.password],
            })
            .then((results) => {
              if (results && results[0] && results[0].result) {
                const loginSuccess = results[0].result;
                handleLoginResult(loginSuccess, request);
              } else {
                console.error('No results or login failed.');
              }
            })
            .catch((err) => {
              console.error('Failed to execute script:', err);
            });
        }
      });
    } catch (err) {
      console.error(`Failed to create tab or execute script: ${err}`);
    }
  }

  if (request.action === 'swagBuck_login') {
    try {
      const newTab = await chrome.tabs.create({
        url: 'https://app.surveyjunkie.com/public/signin',
      });
    } catch {
      null;
    }
  }
});

function executeLogin_SurveyJunkie(email, password) {
  return new Promise((resolve) => {
    const setInputValue = (field, value) => {
      field.value = value;
      field.dispatchEvent(new Event('input', { bubbles: true }));
      field.dispatchEvent(new Event('change', { bubbles: true }));
    };

    const emailField = document.querySelector(
      'input[aria-label="Email address"]'
    );
    const passwordField = document.querySelector('input[type="password"]');
    const loginButton = document.querySelector('button.sc-1saobic-0.fawTDA');

    if (emailField && passwordField) {
      setInputValue(emailField, email);

      setTimeout(() => {
        setInputValue(passwordField, password);

        setTimeout(() => {
          if (loginButton && !loginButton.disabled) {
            loginButton.click();

            setTimeout(() => {
              const errorMessage = document.querySelector(
                '.sc-1u6odhl-4.iATHoB'
              );

              if (errorMessage) {
                console.error('Login failed: ' + errorMessage.textContent);
                resolve(false);
              } else {
                console.log('Login successful or no error message displayed.');
                resolve(true);
              }
            }, 1000); // Adjust the delay as needed
          } else {
            console.error('Login button is disabled.');
            resolve(false);
          }
        }, 100); // Adjust as needed
      }, 100); // Adjust as needed
    } else {
      resolve(false);
    }
  });
}

async function handleLoginResult_SurveyJunkie(loginSuccess, request) {
  console.log('Login result: ', loginSuccess);
  if (loginSuccess) {
    try {
      console.log('Attempting to save credentials...');
      const response = await fetch(
        'http://127.0.0.1:8000/api/surveys/register/',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            user_id: request.userID,
            survey_site: 'Survey Junkie',
            email: request.email,
            password: request.password,
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to save Survey Junkie credentials');
      }

      console.log('Survey Junkie credentials saved.');
    } catch (error) {
      console.error('Error saving Survey Junkie credentials:', error);
      // Optionally, notify the user about the error
    }
  } else {
    console.log('Login failed, not saving credentials.');
    // Optionally, notify the user about the login failure
  }
}

async function handleLoginResult_SwagBuck(loginSuccess, request) {
  console.log('Login result: ', loginSuccess);
  if (loginSuccess) {
    try {
      console.log('Attempting to save credentials...');
      const response = await fetch(
        'http://127.0.0.1:8000/api/surveys/register/',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            user_id: request.userID,
            survey_site: 'Swag_Bucks',
            email: request.email,
            password: request.password,
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to save Survey Junkie credentials');
      }

      console.log('Survey Junkie credentials saved.');
    } catch (error) {
      console.error('Error saving Survey Junkie credentials:', error);
      // Optionally, notify the user about the error
    }
  } else {
    console.log('Login failed, not saving credentials.');
    // Optionally, notify the user about the login failure
  }
}

async function handleLoginResult_SwagBuck(loginSuccess, request) {
  console.log('Login result: ', loginSuccess);
  if (loginSuccess) {
    try {
      console.log('Attempting to save credentials...');
      const response = await fetch(
        'http://127.0.0.1:8000/api/surveys/register/',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            user_id: request.userID,
            survey_site: 'Swag Buck',
            email: request.email,
            password: request.password,
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to save Swag Buck credentials');
      }

      console.log('Swag Buck credentials saved.');
    } catch (error) {
      console.error('Error saving Swag Buck credentials:', error);
      // Optionally, notify the user about the error
    }
  } else {
    console.log('Login failed, not saving credentials.');
    // Optionally, notify the user about the login failure
  }
}
