const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const app = express();

app.use(cors());
app.use(express.json());

const users = [];

//#region Middlewares
function checksExistsUserAccount(request, response, next) {
  // gets the username from the request header
  const { username } = request.headers;

  // finds the user object in the array
  const user = users.find(user => user.username === username);
  
  // checks if the user exists
  if(!user){
    // if not, returns an error message
    return response.status(404).json({error:"User not found."});
  }

  // adds the user object to the request root
  request.user = user;

  return next();
}

function checksExistisTodo(request, response, next) {
  // gets the user injected in the request by the previous middleware
  const { user } = request;
  
  // gets the todo id from the request parameters
  const { id: todoID } = request.params;

  // finds the todo in the user's todos array
  const todo = user.todos.find(todo => todo.id === todoID);

  // checks if the todo existis
  if(!todo){
    // if not, returns an error status and an error message
    return response.status(404).json({error: "Todo not found."})
  }

  request.todo = todo;

  return next();
}
//#endregion

app.post('/users', (request, response) => {
  // gets the name and username from the request body
  const { name, username } = request.body;
  
  // checks if a user with this username was already signed up
  const customerAlreadyExists = users.some(
    (user) => user.username === username
  );

  // if a user with this username already existis
  if(customerAlreadyExists) {
    // returns a response with an error code and an error message
    return response.status(400).json({error: "Username already in use."})
  }

  // creates the new user object
  const newUser = {
    id: uuidv4(),
    name,
    username,
    todos: []
  }

  // pushes the new user object to the users array
  users.push(newUser);

  // returns a success message
  return response.status(201).json(newUser);
});

app.get('/todos', checksExistsUserAccount, (request, response) => {
  // gets the user injected in the request by the middleware
  const { user } = request;

  // returns the todos
  return response.status(201).json(user.todos); 
});

app.post('/todos', checksExistsUserAccount, (request, response) => {
  // gets the title and deadline from the request body
  const { title, deadline } = request.body;

  // gets the user injected in the request by the middleware
  const { user } = request;

  // creates the new todo object
  const newTodo = {
    id: uuidv4(),
    title,
    done: false,
    deadline: new Date(deadline),
    created_at: new Date()
  };

  // pushes the new todo object to the user's todos array
  user.todos.push(newTodo);

  return response.status(201).json(newTodo);
});

app.put('/todos/:id', checksExistsUserAccount, checksExistisTodo, (request, response) => {
  // gets the title and deadline from the request body
  const { title, deadline } = request.body;
  
  // gets the todo injected in the request by the middleware
  const { todo } = request;

  // changes todo values
  todo.title = title;
  todo.deadline = new Date(deadline);

  return response.status(201).json(todo);
});

app.patch('/todos/:id/done', checksExistsUserAccount, checksExistisTodo, (request, response) => {
  // gets the todo injected in the request by the middleware
  const { todo } = request;

  // changes todo values
  todo.done = true;

  return response.status(201).json(todo);
});

app.delete('/todos/:id', checksExistsUserAccount, checksExistisTodo, (request, response) => {
  // gets the todo injected in the request by the middleware
  const { todo } = request;

  // gets the user injected in the request by the middleware
  const { user } = request;

  // filter -> returns a new array with the filter applied 
  user.todos = user.todos.filter(arrayTodo => arrayTodo !== todo)

  return response.status(204).json(user.todos);
});

module.exports = app;