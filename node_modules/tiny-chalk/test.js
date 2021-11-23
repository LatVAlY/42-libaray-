#!/usr/bin/env node
console.time('init time')
const chalk = require('.')
console.timeEnd('init time')

console.log(chalk.red('chalk'))
console.log(chalk.blue('chalk'))
console.log(chalk.yellow('chalk'))
console.log(chalk.green('chalk'))
console.log(chalk.grey('chalk'))
console.log(chalk.bgGrey('chalk'))
console.log(chalk.bgMagenta(chalk.blue('chalk')))
