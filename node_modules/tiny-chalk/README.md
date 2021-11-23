# tiny-chalk

A super tiny version of [chalk](https://github.com/chalk/chalk), loading in ~1ms instead of ~10ms for chalk

## Install

```bash
npm install tiny-chalk
```

## Usage

```js
const { red, bold, bgBlack } = require('tiny-chalk')
console.log(red('Hello world!'))
console.log(bold(bgBlack(red('Hello world again!'))))
```

## Supported styles and colors

```
// style
reset
bold
dim
italic
underline
inverse
hidden
strikethrough

// front color
black
red
green
yellow
blue
magenta
cyan
white
grey
redBright
greenBright
yellowBright
blueBright
magentaBright
cyanBright
whiteBright

// back color
bgBlack
bgRed
bgGreen
bgYellow
bgBlue
bgMagenta
bgCyan
bgWhite
bgGrey
bgRedBright
bgGreenBright
bgYellowBright
bgBlueBright
bgMagentaBright
bgCyanBright
bgWhiteBright
```
