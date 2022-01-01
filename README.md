## Program Author: 

    Mohamed Abbasi

## Building this Web Application improved my skills on:

- Creating a REST application programming interface, primarily focusing on: 
    - Endpoint consistency
    - Navigation paths
    - Authentication
    - Requests and data handling
- Using a database(MongoDB) to store user profile and order information
- Adding session support to the application so that users may log in and place orders
- Working with template engines(Pug) to use static template files and to also interpolate data-bound values into my markup
- Creating a login, logout and register feature in the server while being all the data is stored in the database

## Design and Implementation:

    MongoDB Storage:

        1. The USER_COLLECTION will store the 10 users initialized from database-initializer.js + all the new users registered through the register page
        2. The Order collection will store the users order following the schema in OrderModel.js
        3. users collection will contain only the new registered users which I used for reference when handling the GET /register request
        4. UserSession collection will store the session data

    Registering A New User:

        The UserModel.js file uses mongoose to create a new schema for the users registered in the register page, and if a user tries to use a 
        username that's already been taken they will be prompted a message to choose a different username

    Navigation Header:

        When a user is not logged in, Home - Users - Register will be displayed, and when Users is clicked it will only show the name of the 
        user selected and their unique ID
        
        When a user logs in/registers they will be directed to their home page with a welcome message and the new Navigation Header will be 
        Home - Users - Order - Logout

    Logging out:
        
        Will set request.session.username to null and request.session.loggedin to false

## Demonstration:

![Getting Started](./public/demo.png)
![Getting Started](./public/demo2.png)

### MongoDB Storage:
- Storing the order information:
```js
[
    {
        _id: ObjectId("61cebfc6caa0df3ada650a49"),
        username: 'Mohamed',
        restaurantID: 0,
        restaurantName: 'La Pizzeria',
        total: 62,
        subtotal: 51.9,
        fee: 5,
        tax: 5,
        order: {
            '1': 'quantity: 2, name: Buffalo Wings',
            '2': 'quantity: 1, name: BBQ Chicken',
            '3': 'quantity: 1, name: Spinach, feta, mushroom, sausage',
            '4': 'quantity: 1, name: Lemonade'
        },
    }
]
```
- Storing a new user:
```js
[
  {
    _id: ObjectId("61cebb1c90d80e88ce3f4797"),
    username: 'Mohamed',
    password: 'Github'
  }
]
```
