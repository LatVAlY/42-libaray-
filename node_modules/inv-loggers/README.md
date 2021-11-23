a little server-side library to log things with colors, with a special care for promise chains

# Summary
- [Installation](#installation)
- [Functions](#functions)
  - [Basics](#basics)
  - [Partials](#partials)
- [License](#license)

# Installation
in a terminal at your project root:

```bash
npm install inv-loggers --save
```

then in your javascript project:
```javascript
var log = require('inv-loggers')
```
or as I prefer, extend your _ object
```javascript
var _ = require('lodash') // or var _ = require('underscore')
var loggers = require('inv-loggers')
_.extend _, loggers
```

this is the syntax we will use in the following examples

# Functions

## Basics

### log
the basic logger from which all others are just variations
```javascript
var obj = {a: 1}
_.log(obj, 'that zuper obj')
```
which in logs, generate something like:
```
****** that zuper obj ******
{ a: 1 }
-----
```
with some colors that can't be made visible in this markdown file (in the caseof `_.log`, cyan)

And that's pretty much all: **a label with fat delimiters and some colors to make your debugging/logs scanning easy**

NB: returns the object for convenience

### success
The same but in green

### info
The same but in blue

### warn
The same but in yellow

NB: returns undefined to avoid returning an error object

### error
The same but in red, used to log error objects.

It will try to log `err.stack` instead of just the err object to get a stack trace in logs when available

NB: returns undefined to avoid returning an error object

### errorRethrow
The same as error but throws the error object instead of just returning undefined (especially useful used as a partial in a promise chain, see hereafter)

## Partials
in promise chains, it can be useful to log an object passed at the middle of the chain, but using just those loggers would be sub-optimal, verbose:
```javascript
getSomeData()
.then(function (result) { return _.log(result, 'some data') })
.then(doSomethingWithIt)
.catch(function (error) { _.error(error, 'some data error')})
```
so we use [partials](http://benalman.com/news/2012/09/partial-application-in-javascript) instead, to which we pass a label and which returns a function with a label pre-set. So we can rewrite this example like so:
```javascript
getSomeData()
.then(_.Log('some data'))
.then(doSomethingWithIt)
.catch(_.Error('some data error'))
```
Note here that if we want to be able to log an error generated in this chain but still be able to handle it elsewhere, we need to make sure the error is rethrown, which can be done by replacing the last line with
```javascript
.catch(_.ErrorRethrow('some data error'))
```

The partial functions have the same name as the basic functions but simply capitalized: **Log**, **Info**, **Success**, **Warn**, **Error**, **ErrorRethrow**

Capitalizing high-order functions as such is a convention used in my projects as I use very few constructors, but you might thing it is an heretic choice. In this case, don't use this library.

# License
[MIT](https://opensource.org/licenses/MIT)
