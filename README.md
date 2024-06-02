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

3. Set up environment variables:
    - Create a `.env` file in the root directory.
    - Add the required environment variables (e.g., Ford API credentials).

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
