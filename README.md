# Flowdock Utilities/Notifier

This project was built to provide features that were missing when migrating from Skype to
Flowdock. The following features that were missing from Skype have been implemented:

* Notifying you if certain keywords were said in one or more flows. This is complete 
with a notification and a sound (that can be enabled or disabled)
* The ability to close out of a flow in flowdock and still get notifications for it. 
This is useful if the flow isn't used too often and you'd like to get notified if 
anyone ever does post in it. 

This project was also expanded to provide searching capabilities that are missing in 
the Flowdock application. Flowdock supports searching flows just fine. For some reason, 
1-to-1's are not searchable using the same method. The only way to currently search them 
(as of 2018-03-27) is to use Flowdock's API. This is annoying at best so this utilities 
app makes it a _little_ easier to do. Flows are also searchable from this app as well 
since it was easy to add that part in with the user search working. 

## Installation
### Prerequisites

[NodeJS](http://nodejs.org/) is used to run the backend part of this application and  
to serve the web interface files. Install this before preceding.

You will also need to have git to clone this repository.

### Installing Dependencies

There are two package managers in this: `npm` and `bower`. At this time, `bower` is still 
being used but this should be switched to a different manager at some point. `npm` is 
automatically configured to run `bower` automatically. So to install the dependencies, 
simply run this in the application root in a terminal or command prompt:

```
npm install
```

### Starting the Backend

The backend NodeJS server handles authentication requests and also handles proxying  
requests to Flowdock from the frontend. It also serves the application files. 

To start the backend, change into the `/server` directory from the root of the  
application. From here, you can start the backend server by running:

```
node server.js
```

The application defaults to running on port `3000` and also uses `/notifier` as the 
application path. 

### Proxying the Backend Server to a Normal Web Server

If you desire to expose the backend via a web server, you have to proxy requests to the 
backend. This readme contains instructions for NGINX and Apache2. These guides assume 
you are using port `3000` for the backend and that the backend path is still `/notifier` 
for the application and that the front end path will be `/notifier`. The instructions 
also assume the backend server is running on the same server as the web server.

#### Apache2

Add these lines to your appache configuration:
```
ProxyPass /notifier http://localhost:3000/notifier
ProxyPassReverse /notifier http://localhost:3000/notifier
```

#### NGINX

Coming soon ...
```

## Testing

There are currently no tests in this application.

