
const fs = require('fs');
const path = require('path');
const randomTitle = require('./randomTitle');
const Chance = require('chance');
const Book = require('./Book');
const Author = require('./Author');
const bookGenres = require('./bookGenres');

const config = require('./config');

const chance = new Chance();
const genders = ['male', 'female'];

function generateRandomBooks(booksCount) {
	const result = {};

	const getUniqueTitle = () => {
		const bookName = randomTitle();
		let newBookName = bookName;
		let vol = 1;
		while (result[newBookName]) {
			newBookName = `${bookName} vol. ${vol}`;
			vol++;
		}
		return newBookName;
	};

	for (let i = 0; i < booksCount; i++) {
		const bookName = getUniqueTitle();
		const gender = chance.pickone(genders);
		const authorName = chance.name({ gender });
		const bookGenre = chance.pick(bookGenres);
		const date = chance.date({ string: true, year: chance.year({min: 1995, max: 2017 })});

		result[bookName] = new Book(bookName, new Author(authorName, gender), bookGenre, date);
	}

	return Object.keys(result).reduce((acc, key) => {
		acc.push(result[key]);
		return acc;
	}, []);
}

function insertPart(db, cnt, bulkSize, data, dataLen) {
	return new Promise((resolve, reject) => {
		let bulk = db.books.initializeOrderedBulkOp()
		for (let i = cnt; (i < cnt + bulkSize) && (i < dataLen); i++) {
			bulk.insert(data[i]);
		};

		bulk.execute((err, res) => {
			if (err) {
				console.error('Error', err);
				reject(err);
			} else {
				console.log('Done! index:', cnt);		
				resolve(new Promise((r) => {
					if (cnt <= dataLen) {
						r(insertPart(db, cnt + bulkSize, bulkSize, data, dataLen));
					} else {
						r();
					}
				}));
			}
		});
	});	
}

function insertToMongo(data) {
	const mongojs = require('mongojs');

	const db = mongojs(config.db, ['books']);

	const prom = [];

	
	let cnt = 0;
	const bulkSize = 1000;
	const dataLen = data.length;

	let res = insertPart(db, cnt, bulkSize, data, dataLen);
	res.then(() => {
		console.log('ok');
		db.close();
	}, (err) => {
		console.log('err', err);
		db.close();
	});
}

function main() {
	if (process.argv.length < 3) {
		console.error(`USAGE: ${path.basename(process.argv[1])} <books count> [output file name]`);
		return;
	}

	const booksCount = +process.argv[2];
	const fileName = process.argv[3];

	const result = generateRandomBooks(booksCount);

	if (fileName) {
		fs.writeFileSync(fileName, JSON.stringify(result));
	} else {
		insertToMongo(result);
	}
}

main();