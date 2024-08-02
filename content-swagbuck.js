// Function to perform login actions
function performLogin(email, password) {
  console.log('Performing login...');
  console.log('Email and password in performLogin: ', email, password);

  const emailField = document.querySelector('input[name="emailAddress"]');
  const passwordField = document.querySelector('input[type="password"]');
  const loginButton = document.querySelector('button[id="loginBtn"]');

  if (emailField && passwordField && loginButton) {
    emailField.value = email;
    passwordField.value = password;
    passwordField.dispatchEvent(new Event('input', { bubbles: true }));
    passwordField.dispatchEvent(new Event('change', { bubbles: true }));

    setTimeout(() => {
      if (!loginButton.disabled) {
        loginButton.click();
        console.log('Login attempted.');
      } else {
        console.error('Login button is disabled.');
        sendLoginResult(false, email, password, 'Login button is disabled.');
      }
    }, 500);
  } else {
    console.error('Email or password fields not found.');
    sendLoginResult(
      false,
      email,
      password,
      'Email or password fields not found.'
    );
  }
}

// Function to check if the user is on the homepage
function checkHomepage(email, password, user_id) {
  console.log('Checking homepage...');
  const homepageElement = document.querySelector('#sbContent');

  if (homepageElement) {
    sendLoginResult(true, email, password, user_id, 'Homepage content found.');
  } else {
    sendLoginResult(
      false,
      email,
      password,
      user_id,
      'Homepage content not found.'
    );
  }
}

function getBalance() {
  console.log('Getting the balance...');
  const balanceElement = document.querySelector('var#sbBalanceAmount');
  if (balanceElement) {
    const rawBalance = balanceElement.getAttribute('data-sb-raw');
    const balanceText = balanceElement.textContent.trim();

    chrome.storage.local.set(
      { swagbuck_balance: { balanceText, rawBalance } },
      () => {
        console.log('Balance saved to Chrome storage.');
      }
    );

    return {
      rawBalance: rawBalance,
      balanceText: balanceText,
    };
  } else {
    console.error('Balance element not found.');
    return { rawBalance: null, balanceText: 'N/A' };
  }
}

// Function to send the result to the background script
function sendLoginResult(success, email, password, user_id, message) {
  console.log('Sending login result:', success, email, password);

  chrome.runtime.sendMessage({
    from: 'content-swagbuck',
    action: 'home-check',
    loginSuccess: success,
    email: email,
    password: password,
    user_id: user_id,
    message: message,
  });
}

// Listen for messages from the background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'swagbuck_login') {
    performLogin(request.email, request.password);
  } else if (request.action === 'check_homepage') {
    checkHomepage(request.email, request.password, request.user_id);
  } else if (request.action === 'swagbuck-getBalance') {
    const balance = getBalance();
  }
});
