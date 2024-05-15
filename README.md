# PEL-Backend API

## Previous Requirements

- node.js v16 +

## Main Branches

- production: Production Code
- development: QA / Development server code
- dev_shahzaib: Dev code
- dev_daniyal_backend: Dev code

---

## Install Dependencies

You must enter the cloned folder and enter the following command.

```
npm i
```

---

## Application Settings

1. Create the `.env` file or copy and refresh the `env.example` file
2. Enter the required data


<strong>NOTE:</strong> Another alternative is to run the project in development mode

```bash
$ npm run dev
```

## Run Server

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```


## Project Structure
├───assets <br>
│ ├───content_images <br>
│ ├───gallery_images <br>
│ ├───interest_icons <br>
│ └───profile <br>
├───config <br>
├───controllers <br>
│ └───admin <br>
├───helpers <br>
├───keys <br>
├───middleware <br>
├───migrations <br>
├───models <br>
├───node_modules <br>
├───public <br>
│ └───admin <br>
│ └───assets <br>
│ ├───css <br>
│ ├───fonts <br>
│ │ ├───icons <br>
│ │ │ └───svg <br>
│ │ └───roboto <br>
│ ├───img <br>
│ │ ├───basic <br>
│ │ ├───demo <br>
│ │ │ ├───portfolio <br>
│ │ │ └───shop <br>
│ │ ├───dummy <br>
│ │ │ └───logos <br>
│ │ ├───icon <br>
│ │ ├───logo <br>
│ │ └───svg <br>
│ ├───js <br>
│ └───sweetalert2 <br>
├───routes <br>
├───seeds <br>
├───src <br>
│ ├───agora <br>
│ ├───api_token <br>
│ ├───firebase <br>
│ └───user <br>
└───views <br>
├───admin <br>
│ ├───admin_user <br>
│ ├───characteristics <br>
│ ├───community <br>
│ ├───content <br>
│ ├───customer <br>
│ ├───education <br>
│ ├───interest <br>
│ ├───plan <br>
│ ├───question <br>
│ ├───religions <br>
│ ├───reported_users <br>
│ ├───request_log <br>
│ ├───roles <br>
│ ├───settings <br>
│ └───work <br>
├───auth <br>
└───partials <br>
