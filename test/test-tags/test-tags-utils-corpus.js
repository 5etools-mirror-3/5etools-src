export class TagTestCorpusHeaderUidMap {
	_tagInfos = {};

	addTagInfo ({prop, id, ixChapter, uid, filePath}) {
		(((this._tagInfos[prop] ||= {})[id] ||= {})[ixChapter] ||= []).push({uid, filePath});
	}

	getTagInfos () { return this._tagInfos; }
}

export const getInvalidCorpusHeaderUidMessage = ({tagTestUrlLookup, tagTestCorpusHeaderUidMap, prop, uid, filePath}) => {
	const tag = `@${prop}`;
	const {id, ixChapter} = UidUtil.unpackUidAdventureBook(uid, {isLower: true});

	if (!id) return `Missing link: ${prop} header UID "${uid}" had no corpus ID!\n`;

	const url = `${DataLoader.getPropPage(prop)}#${UrlUtil.getHashBuilder(prop)({id})}`;
	if (!tagTestUrlLookup.hasUrl(url)) return `Missing link: ${prop} header UID "${uid}" in file ${filePath} had unknown "${tag}" ID "${id}"\n`;

	if (ixChapter == null) {
		tagTestCorpusHeaderUidMap.addTagInfo({prop, id, ixChapter: 0, uid, filePath});
		return;
	}

	if (isNaN(ixChapter) || Number(ixChapter) < 0) return `Missing link: ${prop} header UID "${uid}" in file ${filePath} had unknown "${tag}" chapter "${ixChapter}"\n`;

	tagTestCorpusHeaderUidMap.addTagInfo({prop, id, ixChapter, uid, filePath});

	return null;
};
