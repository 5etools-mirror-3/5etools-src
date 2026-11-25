export class UtilBookUtil {
	static getStatblockHash ({header, bookSource}) {
		if (header.uid) {
			const prop = Parser.getTagProps(header.tag)[0];
			const unpacked = DataUtil.proxy.unpackUid(prop, header.uid, header.tag);
			return UrlUtil.getHashBuilder(prop)(unpacked);
		}

		return UrlUtil.URL_TO_HASH_GENERIC({
			name: header.header || header,
			source: header.source || bookSource,
		});
	}
}

export class UtilBookUtilHash {
	static getFullBookHeaderIndex ({headerName, headerIndex = 0, ixChapterFirstTitle, trackedTitles}) {
		const headerNameClean = Renderer.utils.TitleRelativeIndexTracker.getCleanName(headerName);

		const offset = Object.entries(trackedTitles)
			.filter(([ixTitle, title]) => Number(ixTitle) < ixChapterFirstTitle
				&& Renderer.utils.TitleRelativeIndexTracker.getCleanName(title) === headerNameClean)
			.length;

		return headerIndex + offset;
	}
}
