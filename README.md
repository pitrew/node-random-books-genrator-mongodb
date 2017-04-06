# Random books generator

Generates JSON object with random book data.

## Installation
```bash
npm install
```

## Usage
```bash
node index.js <books count> [output file name]
```
If output file name is specified then json is written to that file otherwise data is written to mongoDB database. Edit `config.js`.

*config.js*
```javascript
const config = {
	db: 'user:pss@db.mlab.com:51060/dbname',
};
module.exports = config;
```
