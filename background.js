chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
  if (request.action === 'surveyJunkie_login') {
    try {
      const newTab = await chrome.tabs.create({
        url: 'https://app.surveyjunkie.com/public/signin',
      });

      chrome.tabs.onUpdated.addListener(function onUpdated(tabId, changeInfo) {
        if (tabId === newTab.id && changeInfo.status === 'complete') {
          chrome.tabs.onUpdated.removeListener(onUpdated);

          chrome.scripting.executeScript({
            target: { tabId: newTab.id },
            func: executeLogin,
            args: [request.email, request.password],
          });
        }
      });
    } catch (err) {
      console.error(`Failed to create tab or execute script: ${err}`);
    }
  }
});

function executeLogin(email, password) {
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
            const errorMessage = document.querySelector('.sc-1u6odhl-4.iATHoB');

            if (errorMessage) {
              console.error('Login failed: ' + errorMessage.textContent);
              chrome.storage.local.set({ survey_junkie_successful: false });
            } else {
              console.log('Login successful or no error message displayed.');
              chrome.storage.local.set({ survey_junkie_successful: true });
            }
          }, 1000); // Adjust the delay as needed
        } else {
          console.error('Login button is disabled.');
          chrome.storage.local.set({ survey_junkie_successful: false });
        }
      }, 100); // Adjust as needed
    }, 100); // Adjust as needed
  } else {
    chrome.storage.local.set({ survey_junkie_successful: false });
  }
}
