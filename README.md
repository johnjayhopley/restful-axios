# README #

Axios restful wrapper that allow you to store and run calls from set namespace.

### Installation ###

```js
$ npm install restful --save
```

### Import ###

```js
import restful from 'restful';
```

### Usage ###

```js
const restful = new Restful({
  baseUrl: 'https://reqres.in/api',
});

restful.addModel({
  name: 'users',
  endpoints: {
    getUser: {
      url: '/users',
      method: 'get',
      params: { id: null },
      headers: {
        Authorization: 'xxx-xxx',
      },
    },
    all: {
      url: '/users',
      method: 'get',
      transform: (response) => {
        response.data.forEach((value, index) => {
          response.data[index].randomInt = Math.random();
        });
        return response;
      },
    },
  },
});


restful.api.users.getUser.request({ id: 1 }).then((response) => {
  // set state 
}

restful.api.users.all.request().then((response) => {
  // set state 
}
```