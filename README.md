<a href="https://www.buymeacoffee.com/brandong">
  <img src="https://github.com/brandon-grant/brandon-grant/blob/243524fee028be9f7adbc8c49534e07e7c17c1d7/bmc-button.png" alt="Buy Me a Coffee" width="200" />
</a>

---

# Ford Connected Car

This repository contains the implementation for handling the OAuth flow to retrieve an access token from Ford's API. The project leverages various technologies to authenticate users and manage interactions with Ford's API securely and efficiently.

## Getting Started

### Prerequisites

- Node.js (v14 or later)
- npm or yarn
- Firebase CLI

### Installation

1. Clone the repository:
    ```bash
    git clone https://github.com/brandon-grant/ford-connected-car.git
    cd ford-connected-car
    ```

2. Install dependencies:
    ```bash
    npm install
    # or
    yarn install
    ```

### Usage

1. Deploy to Firebase:
    ```bash
    firebase deploy --only functions
    ```

2. Run the application locally:
    ```bash
    firebase emulators:start
    ```

### Example

Here's a basic example of how to use the OAuth2 client to get an access token:

```typescript
import { OAuth2Client } from './lib/auth/oauth-client';

const authClient = new OAuth2Client({ username: 'your-email@example.com', password: 'your-password' });

authClient.getAccessTokenFromAuthCode()
    .then(token => {
        console.log('Access Token:', token);
    })
    .catch(error => {
        console.error('Error:', error);
    });

```

## Contributing
Contributions are welcome! Please submit a pull request or open an issue to discuss any changes or improvements.

## Disclaimer

This code is not affiliated with, endorsed by, or connected to Ford Motor Company. It is an independent project intended for educational and research purposes only.
