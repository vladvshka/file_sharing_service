import express from 'express';
import path from 'path';
import fs from 'fs';

const fsp = fs.promises;
const galleryRouter = express.Router();

galleryRouter.get('/gallery', async (req, res) => {
	const storageJson = await fsp.readFile(
		path.join(__dirname, '../', 'public', 'storage.json'),
		'utf8'
	);

	const { uploads } = JSON.parse(storageJson);
	const imageReg = /[.](gif|jpg|jpeg|tiff|png)$/i;

	const images = uploads.reduce((accum, file) => {
		const { fileName, comment } = file;

		if (imageReg.test(fileName)) {
			// to thumb!
			const pathToImg = path.join('uploads', fileName);
			accum.push({
				pathToImg,
				fileName,
				comment
			});
		}
		return accum;
	}, []);

	if (images.length > 0) {
		res.render('gallery', { images });
	} else {
		res.render('gallery', { emptyMsg: true });
	}
});

export { galleryRouter };
