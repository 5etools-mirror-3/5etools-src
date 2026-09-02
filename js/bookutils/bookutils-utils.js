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
