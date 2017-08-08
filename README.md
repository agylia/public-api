# Agylia API Reference
## Overview
### API Base URL
The base url for the API is:

`https://api.portal-agylia.com`

Call calls to the API must be made by using HTTPS.

### Authentication
Authentication uses Basic Authentication over SSL/HTTPS. Your user name is the full domain name for your Reach Administration Portal e.g. `example.admin-agylia.com`. Your password is your API key e.g. `7c82041e63db436eb0a681d6910d71aedf32656ef23`. 

You can find your API key in the Reach Administration Portal by logging in, and then clicking _Settings_ -> _General_.

### Request Style
#### REST and RPC
All APIs support an informal RPC style. Many of the APIs also support REST semantics, with a view to making all APIs supporting both styles as the API platform develops.

Our informal RPC style is to `POST` a message to a named URL, where the payload contains the message data e.g.

```
POST /GetUser HTTP/1.1
Host: api.portal-agylia.com
Content-Type: application/json

{
  "params": {
    "uid": "example"
  }
}
```

Our REST style supports sending requests to a resource, e.g. `users`, `reports`, etc. and then the HTTP verb/method determines the desired action e.g.

```
GET /users/example HTTP/1.1
Host: api.portal-agylia.com
```

Both of these examples are equivalent, they both get a user by simply using the two different styles supported.

Each section in the following documentation states which call styles are supported.

---

## APIs
### Users
The user APIs enable you perform user management tasks, such as creating, updating and removing users, as well as updating user group membership. All APIs support both RPC and REST styles.

#### Create a user
You can use the _SetUser_ API to create or update a user.

You can specify the attributes to be associated with a user, including group and OU memberships. When creating users you can also specify the password for the user. If you add a user to a group that does not yet exist, the API will create the group for you.

Create requests typically do not happen in real-time. After the request has been validated and accepted the API returns a `202 Accepted`. With this in mind you can can specify a callback address, which the service will attempt to call upon completion of the request.

If the user exists and the create action is specified then the service will return a `409`.

```
{
    // Message arguments
    params: { 
        action: create,
        callback: url      // optional, default nil
    },
    
    // Profile fields
    profile:{
       username: string    // required
       ...                 // additional user attributes
    },

    // Password information
    password: {
       value: string,      // required
       send_welcome: bool  // optional, default: true
    },

    // Groups information
    groups: [{
        name: string       // required
    }]
}
```

##### Return Codes
| Code | Meaning |
|:--|:--|
| 202 | Accepted — Your request has been accepted |
| 400 | Bad Request – Your request has an incorrect parameter |
| 401 | Unauthorized – Your credentials are missing |
| 403 | Forbidden – Your credentials are not valid |
| 429 | Too Many Requests - Rate limiting |
| 50*n* | Server Error – We had a problem with our server or a remote gateway. Please contact us |

When you receive a `202 Accepted` response, a `Location` header is also returned with the response. This header contains a relative route and a transition ID. If you supply a `callback` URL in the request you'll receive a status update when the message has been processed. However, you can also query the status of you request by calling the status route, appending the `Location` header value:

```
202 Accepted
Location: /status/123
...
```

Given the above response, here is an example to get the status of the request:

```
curl "https://$API_HOST/status/123" \
     -u "scope:api_key"
     
HTTP/1.1 200 OK
Content-Type: application/json

{"message":"example","status":2,"tid":"123"}
```

The `status` field contains the status of the request:

| Status | Meaning |
|:--|:--|
| 0 | Status unknown |
| 1 | Status pending, request processing not started |
| 2 | Status success, completed successfully |
| 3 | Status failed, completed with an error |

If the request fails, the `message` field in the response typically holds the error that occurred.

##### Example
```
// SetUser (create)
curl -X "POST" "https://$API_HOST/SetUser" \
     -H "Content-Type: application/json" \
     -u "scope:api_key" \
     -d $'{
  "params": {
    "action": "create",
    "callback": "https://example.com/agylia-callback/"
  },
  "profile": {
    "username": "example"
    "forename": "Joe",
    "surname": "Bloggs",
    "mail": "joeb@examples.com"
  },
  "password": {
    "value": "@@User_password;1"
  },
  "groups":[{
    "name": "Marketing"
  },{
    "name": "Sales"
  }]
}'
```

#### Read a user
You can use the _GetUser_ API to read a user. This call returns all the profile fields and group memberships for a user. This call happens in real-time.

```
{
    // Message arguments
    params: { 
        uid: string    // required, username for the user
    }
}
```

##### Response
```
{
    "groups":[{
        "name": string
    }],
    "params": {
        "uid": string
    },
    "profile": {
        "forename": string,
        "mail": string,
        ...
    }
}
```

##### Return Codes
| Code | Meaning |
|:--|:--|
| 200 | OK — Your request completed successfully |
| 400 | Bad Request – Your request has an incorrect parameter |
| 401 | Unauthorized – Your credentials are missing |
| 403 | Forbidden – Your credentials are not valid |
| 409 | Conflict – The username is already in use |
| 429 | Too Many Requests - Rate limiting |
| 50*n* | Server Error – We had a problem with our server or a remote gateway. Please contact us |

##### Example
```
curl -X "POST" "https://$API_HOST/GetUser" \
     -H "Content-Type: application/json; charset=utf-8" \
     -u "scope:api_key" \
     -d $'{
  "params": {
    "uid": "example"
  }
}'
```

#### Update a user
You can use the _SetUser_ API to update a user.

You can specify the attributes to be associated with a user, including group and OU memberships. This API uses merge semantics. If you add a user to a group that does not yet exist the API will create the group for you.

Update requests typically do not happen in real-time. After the request has been validated and accepted, the API returns a `202 Accepted`. With this in mind you can can specify a callback address, which the service will attempt to call upon completion of the request.

If the user does not exist the service will return a `404`.

```
{
    // Message arguments
    params: { 
        action: update,
        uid: string,       // required, username
        callback: url      // optional, default nil
    },
    
    // Profile fields
    profile:{
       ...                 // additional user attributes
    }
}
```

##### Return Codes
| Code | Meaning |
|:--|:--|
| 202 | Accepted — Your request has been accepted |
| 400 | Bad Request – Your request has an incorrect parameter |
| 401 | Unauthorized – Your credentials are missing |
| 403 | Forbidden – Your credentials are not valid |
| 404 | Not Found – There username cannot be found |
| 429 | Too Many Requests - Rate limiting |
| 50*n* | Server Error – We had a problem with our server or a remote gateway. Please contact us |

##### Example
```
curl -X "POST" "https://$API_HOST/SetUser" \
     -H "Content-Type: application/json; charset=utf-8" \
     -u "scope:api_key" \
     -d $'{
  "profile": {
    "mail": "hello@example.com"
  },
  "params": {
    "uid": "example",
    "action": "update"
  }
}'
```


#### Remove a user
You can use the _DeleteUser_ API to remove a user. This call will remove all the user properties from the system including all group memberships. This call happens in real-time.

If the user does not exist the service will return a `404`.

```
{
    // Message arguments
    params: { 
        uid: string    // required, username for the user
    }
}
```

##### Return Codes
| Code | Meaning |
|:--|:--|
| 200 | OK — Your request completed successfully |
| 400 | Bad Request – Your request has an incorrect parameter |
| 401 | Unauthorized – Your credentials are missing |
| 403 | Forbidden – Your credentials are not valid |
| 404 | Not Found – There username cannot be found |
| 429 | Too Many Requests - Rate limiting |
| 50*n* | Server Error – We had a problem with our server or a remote gateway. Please contact us |

##### Example
```
curl -X "POST" "https://$API_HOST/DeleteUser" \
     -H "Content-Type: application/json; charset=utf-8" \
     -u "scope:api_key" \
     -d $'{
  "params": {
    "uid": "example"
  }
}'
```

#### Add and remove a user from a group
You can use the _SetUser_ API to update the group memberships for a user.

If you add a user to a group that does not yet exist, the API will create the group for you.

This type of request typically does not happen in real-time. After the request has been validated and accepted the API returns a `202 Accepted`. With this in mind you can can specify a callback address, which the service will attempt to call upon completion of the request.

If the user does not exist the service returns a `404`.

```
{
    // Message arguments
    params: { 
        action: update,
        uid: string,       // required, username
        callback: url      // optional, default nil
    },

    // Groups information
    groups: [{
        name: string       // required
        action: add|remove // action
    }]
}
```

##### Return Codes
| Code | Meaning |
|:--|:--|
| 202 | Accepted — Your request has been accepted |
| 400 | Bad Request – Your request has an incorrect parameter |
| 401 | Unauthorized – Your credentials are missing |
| 403 | Forbidden – Your credentials are not valid |
| 429 | Too Many Requests - Rate limiting |
| 50*n* | Server Error – We had a problem with our server or a remote gateway. Please contact us |

##### Example
```
curl -X "POST" "https://$API_HOST/SetUser" \
     -H "Content-Type: application/json; charset=utf-8" \
     -u "scope:api_key" \
     -d $'{
  "groups": [
    {
      "name": "Sales Support",
      "action": "add"
    },{
      "name": "Marketing",
      "action": "remove"
    }
  ],
  "params": {
    "uid": "example",
    "action": "update"
  }
}'
```

--- 

### Reports
The reports APIs enable you to get activity reports for your users, or an individual user. All APIs support only the RPC style at this time.

#### User Activity
You can use the _GetUserActivity_ API to retrieve the activity history for a specified user. This includes any content/items that are in-progress or completed. This call happens in real-time.

This API supports paging. You can specify a starting index, and the number of items to return per page.

```
{
    // Message arguments
    params: { 
        uid: string,       // required, username
        from: number,      // optional, items to skip, default 0
        size: number       // optional, total returns per page, default 50
    }
}
```

##### Response
```
{
    "activities": [
    {
        "date": string,
        "ref": string,
        "score": null | string,
        "status": string,
        "title": string
    },
    ...
}
```

##### Return Codes
| Code | Meaning |
|:--|:--|
| 200 | OK — Your request completed successfully |
| 400 | Bad Request – Your request has an incorrect parameter |
| 401 | Unauthorized – Your credentials are missing |
| 403 | Forbidden – Your credentials are not valid |
| 429 | Too Many Requests - Rate limiting |
| 50*n* | Server Error – We had a problem with our server or a remote gateway. Please contact us |

##### Example
```
curl -X "POST" "https://$API_HOST/GetUserActivity" \
     -H "Content-Type: application/json; charset=utf-8" \
     -u "scope:api_key" \
     -d $'{
  "params": {
    "uid": "example",
    "size": 5
  }
}'
```

#### Users Activity
You can use the _GetUsersActivity_ API to retrieve any and all activity that has occurred for any user since the supplied input date/time. This call happens in real-time.

```
{
    // Message arguments
    params: { 
        date: string,       // required, on or after date
    }
}
```

##### Response
```
{
    "activities": [
    {
        "completed_date": string,
        "ref": string,
        "score": null|number,
        "status": string,
        "title": string,
        "username": string
    },
    ...
}
```

##### Return Codes
| Code | Meaning |
|:--|:--|
| 200 | OK — Your request completed successfully |
| 400 | Bad Request – Your request has an incorrect parameter |
| 401 | Unauthorized – Your credentials are missing |
| 403 | Forbidden – Your credentials are not valid |
| 429 | Too Many Requests - Rate limiting |
| 50*n* | Server Error – We had a problem with our server or a remote gateway. Please contact us |

##### Example
```
curl -X "POST" "https://$API_HOST/GetUserActivity" \
     -H "Content-Type: application/json; charset=utf-8" \
     -u "scope:api_key" \
     -d $'{
  "params": {
    "uid": "example",
    "size": 5
  }
}'
```

--- 

### Catalogue (Coming Soon)
The catalogues APIs enable you to request information about your catalogue items.

#### My Learning
Coming soon.

#### My Catalogue
Coming soon.
