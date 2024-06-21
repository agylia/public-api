# Civica Learning API Reference
## Overview
### API Base URL
The base url for the API is:

 - For UK customers `https://api.civica-learning.com`
 - For EU customers `https://api.civica-learning.com/eu`
 - For US customers `https://api.civica-learning.com/us`

All calls to the API must be made by using HTTPS.

### Authentication
Authentication uses Basic Authentication over SSL/HTTPS. Your user name is the full domain name for your Civica Learning Administration Portal e.g. `example.learning-admin.com`. Your password is your API key e.g. `7c82041e63db436eb0a681d6910d71aedf32656ef23`.

You can find your API key in the Civica Learning Administration Portal by logging in, and then clicking _Settings_ -> _Advanced_.

### Request Style
All APIs support an informal RPC style. Our informal RPC style is to `POST` a message to a named URL, where the payload contains the message data e.g.

```
POST /GetUser HTTP/1.1
Host: api.civica-learning.com
Content-Type: application/json

{
  "params": {
    "uid": "example"
  }
}
```

---

## APIs
### Users
The user APIs enable you perform user management tasks, such as creating, updating and removing users, as well as updating user group membership.

#### Create a user
You can use the _SetUser_ API to create or update a user.

You can specify the attributes to be associated with a user, including group and OU memberships. When creating users you can also specify the password for the user. If you add a user to a group that does not yet exist, the API will create the group for you.

Create requests typically do not happen in real-time. After the request has been validated and accepted the API returns a `202 Accepted`. With this in mind you can specify a callback address, which the service will attempt to call upon completion of the request.

You can use the `send_welcome` parameter to enable the sending of a welcome email message for new user accounts. The default is to suppress the sending of welcome emails.

You can also use the `override_mandatory_check` parameter to create a user with an incomplete profile. The `username`, `forename`, and `surname` fields are still required, but any custom mandatory fields you may have configured can be omitted.

If the user exists and the create action is specified then the service will return a `409`.

```
{
    // Message arguments
    params: {
        action: create,
        callback: url      // optional, default: nil
        auth_mode: string  // optional, values should be either: sso or forms
        send_welcome: bool // optional, default: false
        override_mandatory_check: bool  // optional, default: false
    },

    // Profile fields
    profile:{
       username: string    // required
       ...                 // additional user attributes
    },

    // Password information
    password: {
       value: string       // optional
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
    "callback": "https://example.com/civica-learning-callback/"
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

#### Read modified users
You can use the _GetModifiedUsers_ API to retrieve any user records that have been
created or updated since the supplied input date/time. This call happens in real-time.

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
  "users": [
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
curl -X "POST" "https://$API_HOST/GetModifiedUsers" \
     -H "Content-Type: application/json; charset=utf-8" \
     -u "scope:api_key" \
     -d $'{
  "params": {
    "date": "2017-01-25T11:44:18.856Z"
  }
}'
```

#### Read inactive users
You can use the _GetInactiveUsers_ API to retrieve any user records for users who have  
not logged in since the supplied input date/time, or who have never logged in. This call happens in real-time.

```
{
    // Message arguments
    params: {
        date: string,       // required, before date
        cursor: string      // optional, the 'next_cursor' value from previous request
    }
}
```

This API will return a maximum of _500_ user records per request. You can use the cursor property
to page through all your inactive users.

##### Response
```
{
  "users": [
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
  },
  ...
  ]
  "next_cursor":string
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
curl -X "POST" "https://$API_HOST/GetInactiveUsers" \
     -H "Content-Type: application/json; charset=utf-8" \
     -u "scope:api_key" \
     -d $'{
  "params": {
    "date": "2017-01-25T11:44:18.856Z"
  }
}'
```

#### Update a user
You can use the _SetUser_ API to update a user.

You can specify the attributes to be associated with a user, including group and OU memberships. This API uses merge semantics. If you add a user to a group that does not yet exist the API will create the group for you.

Update requests typically do not happen in real-time. After the request has been validated and accepted, the API returns a `202 Accepted`. With this in mind you can specify a callback address, which the service will attempt to call upon completion of the request.

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

#### Read profile fields
You can use the _GetProfileFields_ API to get the configured user profile fields for your Civica Learning Administration Portal.

The response from the _GetProfileFields_ API will enable you to determine what mandatory profile fields need to be set prior to using the _SetUser_ API to create or update a user.

##### Response
```
{
  "username": {
    "label": "Username",
    "mode": "Mandatory",
    "order": 0,
    "type": "Text"
  },
  "forename": {
    "label": "First name",
    "mode": "Mandatory",
    "order": 110,
    "type": "Text"
  },
  "surname": {
    "label": "Surname",
    "mode": "Mandatory",
    "order": 120,
    "type": "Text"
  },
  "mail": {
    "label": "Email address",
    "mode": "Optional",
    "order": 130,
    "type": "Text"
  },
  "customDate": {
    "label": "Custom date",
    "mode": "AdminOnly",
    "order": 140,
    "type": "Date"
  },
  "customSingleChoice": {
    "label": "Custom single choice",
    "mode": "Mandatory",
    "order": 150,
    "type": "SingleChoice",
    "values":["value1","value2","value3"]
  },
  "customMultipleChoice": {
    "label": "Custom multiple choice",
    "mode": "Optional",
    "order": 160,
    "type": "MultipleChoice",
    "values":["value1","value2","value3"]
  },
  "timezone": {
    "label": "Time zone",
    "mode": "AdminOnly",
    "order": 900,
    "type": "Text"
  }
}
```

The `mode` can be one of the following values:

 - Mandatory
 - Optional
 - AdminOnly

The `type` can be one of the following values:

- Text
- Date
- SingleChoice
- MultipleChoice
- OU

Given the above response, if you wanted to create a new user via the _SetUser_ API, at minimum you would need to satisfy the `Mandatory` profile fields as follows:

```
{
    ...

    // Profile fields
    profile:{
       username: string    // required
       forename: string    // required  
       surname: string     // required
       customSingleChoice: string    // required, either value1, value2, or value3           
    }
}
```

##### Return Codes
| Code | Meaning |
|:--|:--|
| 200 | OK — Your request completed successfully |
| 401 | Unauthorized – Your credentials are missing |
| 403 | Forbidden – Your credentials are not valid |
| 429 | Too Many Requests - Rate limiting |
| 50*n* | Server Error – We had a problem with our server or a remote gateway. Please contact us |

##### Example
```
curl -X "POST" "https://$API_HOST/GetProfileFields" \
     -H "Content-Type: application/json; charset=utf-8" \
     -u "scope:api_key" \
```

#### Deactivate a user
You can use the _SetUser_ API to deactivate a user.

Deactivate requests typically do not happen in real-time. After the request has been validated and accepted, the API returns a `202 Accepted`. With this in mind you can specify a callback address, which the service will attempt to call upon completion of the request.

If the user does not exist the service will return a `404`.

```
{
    // Message arguments
    params: {
        action: deactivate,
        uid: string,       // required, username
        callback: url      // optional, default nil
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
  "params": {
    "uid": "example",
    "action": "deactivate"
  }
}'
```

#### Activate a user
You can use the _SetUser_ API to activate a user.

Activate requests typically do not happen in real-time. After the request has been validated and accepted, the API returns a `202 Accepted`. With this in mind you can specify a callback address, which the service will attempt to call upon completion of the request.

If the user does not exist the service will return a `404`.

```
{
    // Message arguments
    params: {
        action: activate,
        uid: string,       // required, username
        callback: url      // optional, default nil
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
  "params": {
    "uid": "example",
    "action": "activate"
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

This type of request typically does not happen in real-time. After the request has been validated and accepted the API returns a `202 Accepted`. With this in mind you can specify a callback address, which the service will attempt to call upon completion of the request.

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

#### Validate user credentials
You can use the _ValidateSignature_ API to validate the username and password
for a non SSO user account.

To do this you need to supply an encrypted signature that contains the username, password, and a timestamp i.e. a username of `user1`, a password of `P@$$`, and a timestamp of `2019-08-07T09:25:44.686Z` becomes `:u:user1:p:P@$$:t:2019-08-07T09:25:44.686Z`. This value then needs to be encrypted.

To generate a valid signature you must:

 - Use a valid UTC ISO date as the timestamp.
 - Build a string containing the username, password, and the timestamp with the
 `:u:`, `:p:`, and `:t:` separators.
 - Encrypt the string with the `aes-256-cbc` symmetric algorithm as follows:
   - The encryption key should be an `md5` hash of your API key.
   - The Initialization Vector (IV) should be a random `16` byte value.
   - The final cypher text should be a concatenation of the IV and encrypted value.
 - Encode the signature (cypher text) as `base64`.

```
{
    // Message arguments
    params: {
        signature: string   // required, base64 cypher text
    }
}
```

##### Response
```
{
  "status": "Valid"
}
```

The `status` can be one of the following values:

 - Valid
 - InvalidPassword
 - Deactivated
 - RequiresApproval
 - RequiresNewPasswordWithEmailVerification
 - RequiresNewPassword


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
curl -X "POST" "https://$API_HOST/ValidateSignature" \
     -H "Content-Type: application/json; charset=utf-8" \
     -u "scope:api_key" \
     -d $'{
  "params": {
    "signature": "QVD3c1vuDNGc7HJa2Oz7p20PDtI6ISx3OMv/RXuTQafm/dNtrtm15Mr42vkeeP2WJN10xsMlUOuzq1G6ZJV+Ur1IHsm8Ddr2qYVZc/9ZFMk="
  }
}'
```

---

### Reports
The reports APIs enable you to get activity reports for your users, or an individual user. All APIs support only the RPC style at this time.

#### User Activity
You can use the _GetUserActivity_ API to retrieve the activity history for a specified user. This includes any content/items that are in-progress or completed. User activity is returned for all content types including courses, curricula, files, events, weblinks, tasks and independent learning activies. This call happens in real-time.

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
        "occurred_date": string,
        "stored_date": string,
        "ref": string,
        "external_ref": null | string,
        "score": null | number,
        "status": string,
        "title": string,
        "friendly_type": string
    }, {
      ...
    }]
}
```

The `friendly_type` attribute supports the following values:

 - course
 - file
 - link
 - curriculum
 - event
 - task
 - cpd_journal
 - cpd_entry
 - independent


For event activities, the activity in the response will also contain a `session` object, for example:

```
{
    "activities": [
    {
        ...
        "session": {
          "start_date": string,
          "end_date": string,
          "location": string
        }
    },
    ...
}
```

For activities that have Continuing Professional Development (CPD) configured, the response will also contain a `cpd` object, for example:

```
{
    "activities": [
    {
        ...
        "cpd": {
          "points": number,
          "learning_hours": number
        }
    },
    ...
}
```

> **Deprecation notice**  The `date` response property will be deprecated in favour of the new `occurred_date` response property.

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
You can use the _GetUsersActivity_ API to retrieve any and all activity that has occurred for any user since the supplied input date/time. You can also optionally restrict the results to records in a particular state. The number of activities returned is limited to `500`, and if you wish get more activities you should make additional requests using the `next_cursor` property from the previous response. This call happens in real-time.

```
{
    // Message arguments
    params: {
        from_date: string,  // required, on or after date
        to_date: string,    // optional, before date
        states: array,      // optional, filter results to specified states
        cursor: string      // optional, cursor to get next batch of results
    }
}
```

##### Response
```
{
    "activities": [
    {
        "occurred_date": string,
        "stored_date": string,
        "external_ref": string,
        "ref": string,
        "score": null | number,
        "status": string,
        "title": string,
        "type": string,
        "friendly_type": string,
        "username": string
    }, {
      ...
    }],
    "next_cursor": string, null if no more results available
}
```

The `friendly_type` attribute supports the following values:

 - course
 - file
 - link
 - curriculum
 - event
 - task
 - cpd_journal
 - cpd_entry
 - independent


For event activities, the activity in the response will also contain a `session` object, for example:

```
{
    "activities": [
    {
        ...
        "session": {
          "start_date": string,
          "end_date": string,
          "location": string
        }
    },
    ...
}

```

For activities that have Continuing Professional Development (CPD) configured, the response will also contain a `cpd` object, for example:

```
{
    "activities": [
    {
        ...
        "cpd": {
          "points": number,
          "learning_hours": number
        }
    }
    ...
}
```

> **Deprecation notice** The `params.date` request property and the `date` and `completed_date` response properties will be deprecated in favour of the new `params.from_date` request property, and the `occurred_date` response property respectively.

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
curl -X "POST" "https://$API_HOST/GetUsersActivity" \
     -H "Content-Type: application/json; charset=utf-8" \
     -u "scope:api_key" \
     -d $'{
  "params": {
    "from_date": "2017-01-25T11:44:18.856Z",
    "states": ["completed", "enrolled"]
  }
}'
```

#### Users Certificates
You can use the _GetUsersCertificates_ API to retrieve any and all certificates that have been awarded for any user since the supplied input date/time. The number of certificates returned is limited to `500`, and if you wish get more certificates you should make additional requests using the `next_cursor` property from the previous response. This call happens in real-time.

```
{
    // Message arguments
    params: {
        from_date: string,  // required, on or after date
        to_date: string,    // optional, before date
        cursor: string      // optional, cursor to get next batch of results
    }
}
```

##### Response
```
{
    "certificates": [
    {
        "awared_date": string,
        "certificate_title": null | string,
        "certification_id": string,
        "certification_title": string,
        "score": null | number,
        "expiration_date": null | string,
        "username": string
    }, {
      ...
    }],
    "next_cursor": string, null if no more results available
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
curl -X "POST" "https://$API_HOST/GetUsersCertificates" \
     -H "Content-Type: application/json; charset=utf-8" \
     -u "scope:api_key" \
     -d $'{
  "params": {
    "from_date": "2022-11-24T00:00:00.000Z"
  }
}'
```

---

### Catalogue
The catalogues APIs enable you to request information about your catalogue items.

#### My Learning
You can use the _GetMyLearning_ API to retrieve all that mandatory content items that are targeted to the passed user reference. This call happens in real-time.

```
{
    // Message arguments
    params: {
        uid: string,       // required, username
    }
}
```

##### Response
```

{
  "items": [
    {
      "description": string,
      "name": string,
      "ref": string,
      "score": null|number,
      "status": string,
      "thumbnail": url
    }
    ...
  ]
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
curl -X "POST" "https://$API_HOST/GetMyLearning" \
     -H "Content-Type: application/json; charset=utf-8" \
     -u "scope:api_key" \
     -d $'{
  "params": {
    "uid": "example"
  }
}'
```

#### My Catalogue
You can use the _GetMyCatalogue_ API to retrieve all content items that are targeted to the passed user reference. This call happens in real-time.

```
{
    // Message arguments
    params: {
        uid: string,       // required, username
    }
}
```

##### Response
```

{
  "items": [
    {
      "description": string,
      "name": string,
      "ref": string,
      "score": null|number,
      "status": string,
      "thumbnail": url
    }
    ...
  ]
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
curl -X "POST" "https://$API_HOST/GetMyCatalogue" \
     -H "Content-Type: application/json; charset=utf-8" \
     -u "scope:api_key" \
     -d $'{
  "params": {
    "uid": "example"
  }
}'
```

#### Enrol Learner

You can use the _EnrolLearner_ API to enrol a user on a content item i.e. a catalogue item or a session.

```
{
    // Message arguments
    params: {
        uid: string,       // required, username
        ref: string,       // required, content item external reference
    },
}
```

##### Return Codes
| Code | Meaning |
|:--|:--|
| 200 | OK — Your request completed successfully |
| 400 | Bad Request – Your request has an incorrect parameter |
| 400 | Bad Request – The user is not targeted to the content item |
| 400 | Bad Request – There are no seats available on the session |
| 401 | Unauthorized – Your credentials are missing |
| 403 | Forbidden – Your credentials are not valid |
| 404 | Not Found – The username cannot be found |
| 404 | Not Found – The content item cannot be found |
| 429 | Too Many Requests - Rate limiting |
| 50*n* | Server Error – We had a problem with our server or a remote gateway. Please contact us |

##### Example
```
curl -X "POST" "https://$API_HOST/EnrolLearner" \
     -H "Content-Type: application/json; charset=utf-8" \
     -u "scope:api_key" \
     -d $'{
  "params": {
    "uid": "example",
    "ref": "example"
  }
}'
```

#### Unenrol Learner

You can use the _UnenrolLearner_ API to unenrol a user from a content item i.e. a catalogue item or a session.

```
{
    // Message arguments
    params: {
        uid: string,       // required, username
        ref: string,       // required, content item external reference
    },
}
```

##### Return Codes
| Code | Meaning |
|:--|:--|
| 200 | OK — Your request completed successfully |
| 400 | Bad Request – Your request has an incorrect parameter |
| 400 | Bad Request – The user is not targeted to the content item |
| 401 | Unauthorized – Your credentials are missing |
| 403 | Forbidden – Your credentials are not valid |
| 404 | Not Found – The username cannot be found |
| 404 | Not Found – The content item cannot be found |
| 429 | Too Many Requests - Rate limiting |
| 50*n* | Server Error – We had a problem with our server or a remote gateway. Please contact us |

##### Example
```
curl -X "POST" "https://$API_HOST/UnenrolLearner" \
     -H "Content-Type: application/json; charset=utf-8" \
     -u "scope:api_key" \
     -d $'{
  "params": {
    "uid": "example",
    "ref": "example"
  }
}'
```

#### Set Content Complete

You can use the _SetContentComplete_ API to mark a learner as complete for a catalogue item.

```
{
    // Message arguments
    params: {
        uid: string,       // required, username
        ref: string,       // required, content item external reference
    },
}
```

##### Return Codes
| Code | Meaning |
|:--|:--|
| 200 | OK — Your request completed successfully |
| 400 | Bad Request – Your request has an incorrect parameter |
| 400 | Bad Request – The user is not targeted to the content item |
| 400 | Bad Request – There are no seats available on the session |
| 400 | Bad Request - Content not targeted |
| 401 | Unauthorized – Your credentials are missing |
| 403 | Forbidden – Your credentials are not valid |
| 404 | Not Found – The username cannot be found |
| 404 | Not Found – The content item cannot be found |
| 429 | Too Many Requests - Rate limiting |
| 50*n* | Server Error – We had a problem with our server or a remote gateway. Please contact us |

##### Example
```
curl -X "POST" "https://$API_HOST/SetContentComplete" \
     -H "Content-Type: application/json; charset=utf-8" \
     -u "scope:api_key" \
     -d $'{
  "params": {
    "uid": "example",
    "ref": "example"
  }
}'
```

#### Award a certificate
You can use the _AwardCertificate_ API to award a certification to a user.

You can optionally specify the attributes to be associated with the certification, including a score, awarded date, expiry date, and whether the user will receive a notification that includes a copy of their PDF certificate. You can optionally supply additional placeholder parameter values by passing a set of key/value pairs via the `extensions` attribute.

```
{
    // Message arguments
    params: {
       uid: string,       // required, username
       ref: string,       // required, certificate identifier
    },

    // Certification fields
    certification: {
       awardMode: string             // additional attribute, default: manual
       awardedDate: string           // additional attribute
       expiryDate: string            // additional attribute
       extensions: object            // additional attribute
       score: number                 // additional attribute, decimal number
       suppressNotifications: bool   // additional attribute, default: false
    },
}
```

The optional `awardMode` attribute supports the following values:

 - Manual - use this mode to award an arbitrary certification.
 - Award -  use this mode to award a certification to a user for the first time, and where you wish to use Civica Learning's certification renewal features.
 - Renew -  use this mode when renewing a certification previously awarded to a user.

##### Return Codes
| Code | Meaning |
|:--|:--|
| 200 | OK — Your request completed successfully |
| 400 | Bad Request – Your request has an incorrect parameter |
| 401 | Unauthorized – Your credentials are missing |
| 403 | Forbidden – Your credentials are not valid |
| 404 | Not Found - Their username cannot be found |
| 429 | Too Many Requests - Rate limiting |
| 50*n* | Server Error – We had a problem with our server or a remote gateway. Please contact us |

##### Example
```
curl -X "POST" "https://$API_HOST/AwardCertificate" \
     -H "Content-Type: application/json" \
     -u "scope:api_key" \
     -d $'{
 "params": {
   "uid": "example",
   "ref": "example"
 },
 "certification": {
   "awardedDate": "2019-05-15T17:00:00Z",
   "score": 85.50,
   "extensions": {"key1": "value1"}
 }
}'
```

---

### Continuing Professional Development (CPD)
The CPD APIs enable you to perform CPD management tasks, such as creating, updating and listing journals.

#### Create a journal
You can use the _SetJournal_ API to create a CPD journal.

You can specify the attributes to be associated with a CPD journal, including a start date, end date, submission date, status, target, and target mode.

```
{
    // Message arguments
    params: {
        action: create,
        uid: string    // required, username
    },

    // Journal fields
    journal: {
       startDate: string,       // required
       endDate: string,         // required
       submissionDate: string,  // additional attribute
       status: string           // additional attribute
       target: string           // additional attribute, whole number
       targetMode: string       // additional attribute
    },
}
```

The optional `status` attribute supports the following values:

 - Pending
 - Submitted
 - Accepted
 - Rejected
 - YearBreak

##### Response
```
{
   "ref": string
}
```

##### Return Codes
| Code | Meaning |
|:--|:--|
| 200 | OK — Your request completed successfully |
| 400 | Bad Request – Your request has an incorrect parameter |
| 401 | Unauthorized – Your credentials are missing |
| 403 | Forbidden – Your credentials are not valid |
| 404 | Not Found - Their username cannot be found |
| 429 | Too Many Requests - Rate limiting |
| 50*n* | Server Error – We had a problem with our server or a remote gateway. Please contact us |

##### Example
```
curl -X "POST" "https://$API_HOST/SetJournal" \
     -H "Content-Type: application/json" \
     -u "scope:api_key" \
     -d $'{
 "params": {
   "uid": "example",
   "action": "create"
 },
 "journal": {
   "endDate": "2019-12-31T17:00:00Z",
   "startDate": "2019-01-01T08:00:00Z",
   "status": "Submitted",
   "target": "25"
 }
}'
```

#### Get journals
You can use the _GetJournals_ API to retrieve all CPD journals to the passed user reference.

```
{
    // Message arguments
    params: {
        uid: string    // required, username
    }
}
```

##### Response
```
{
    "items": [
    {
      "ref": string,
      "startDate": string,
      "endDate": string,
      "submissionDate": string,
      "status": string,
      "target": string,
      "targetMode": string
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
| 404 | Not Found - Their username cannot be found |
| 429 | Too Many Requests - Rate limiting |
| 50*n* | Server Error – We had a problem with our server or a remote gateway. Please contact us |

##### Example
```
curl -X "POST" "https://$API_HOST/GetJournals" \
     -H "Content-Type: application/json" \
     -u "scope:api_key" \
     -d $'{
 "params": {
   "uid": "example"
 }
}'
```

#### Update a journal
You can use the _SetJournal_ API to update a CPD journal.

You can specify the attributes to be associated with a CPD journal, including a start date, end date, submission date, status, target, and target mode.

```
{
    // Message arguments
    params: {
        action: update,
        uid: string,    // required, username
        ref: string     // required, journal reference
    },

    // Journal fields
    journal: {
       startDate: string,       // required
       endDate: string,         // required
       submissionDate: string,  // additional attribute
       status: string           // additional attribute
       target: string           // additional attribute, whole number
       targetMode: string       // additional attribute
    },
}
```

The optional `status` attribute supports the following values:

 - Pending
 - Submitted
 - Accepted
 - Rejected
 - YearBreak

##### Response
```
{
  "ref": string
}
```

##### Return Codes
| Code | Meaning |
|:--|:--|
| 200 | OK — Your request completed successfully |
| 400 | Bad Request – Your request has an incorrect parameter |
| 401 | Unauthorized – Your credentials are missing |
| 403 | Forbidden – Your credentials are not valid |
| 404 | Not Found - Their username or journal cannot be found |
| 429 | Too Many Requests - Rate limiting |
| 50*n* | Server Error – We had a problem with our server or a remote gateway. Please contact us |

##### Example
```
curl -X "POST" "https://$API_HOST/SetJournal" \
     -H "Content-Type: application/json" \
     -u "scope:api_key" \
     -d $'{
 "params": {
   "uid": "example",
   "ref": "example",
   "action": "update"
 },
 "journal": {
   "endDate": "2019-12-31T17:00:00Z",
   "startDate": "2019-01-01T08:00:00Z",
   "status": "Accepted",
   "target": "10",
   "targetMode": "credits"
 }
}'
```
---

### Learning Record Store (LRS)

The LRS APIs enable you to perform LRS management tasks. Currently this is limited to just retrieving a user's LRS configuration so you can communicate directly with the LRS.

#### Get LRS configuration

You can use the _GetLrsConfig_ API to retrieve the LRS configuration for a user.

```
{
    // Message arguments
    params: {
        uid: string    // required, username
    }
}
```

##### Response

```
{
  "agent": string,
  "authToken": string,
  "endpoint": string
}
```

##### Return Codes

| Code  | Meaning                                                                                |
| :---- | :------------------------------------------------------------------------------------- |
| 200   | OK — Your request completed successfully                                               |
| 400   | Bad Request – Your request has an incorrect parameter                                  |
| 401   | Unauthorized – Your credentials are missing                                            |
| 403   | Forbidden – Your credentials are not valid                                             |
| 404   | Not Found - Their username cannot be found                                             |
| 429   | Too Many Requests - Rate limiting                                                      |
| 50*n* | Server Error – We had a problem with our server or a remote gateway. Please contact us |

##### Example

```
curl -X "POST" "https://$API_HOST/GetLrsConfig" \
     -H "Content-Type: application/json" \
     -u "scope:api_key" \
     -d $'{
 "params": {
   "uid": "example"
 }
}'
```
