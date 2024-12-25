import "../../js/parser.js";
import "../../js/utils.js";
import "../../js/render.js";

test(
	"Test object walker",
	() => {
		const obj = {
			a: 1,
			b: [2, 3],
			c: {
				d: 4,
			},
			e: [
				[null, undefined, 5, 6],
				{
					f: 7,
					g: 8,
				},
			],
		};
		const cpyObj = MiscUtil.copyFast(obj);

		const handlers = {
			[null]: () => undefined,
			[undefined]: () => null,
			boolean: bool => !bool,
			number: num => num + num,
			string: str => str + str,
			array: arr => [...arr, -1],
			object: obj => ({...obj, h: -2}),
		};

		const walked1 = MiscUtil.getWalker({isNoModification: true}).walk(obj, {});
		expect(obj).toEqual(cpyObj);
		expect(walked1).toBe(obj);
		expect(walked1).toEqual(cpyObj);

		const walked2 = MiscUtil.getWalker({isNoModification: true}).walk(obj, handlers);
		expect(obj).toEqual(cpyObj);
		expect(walked2).toBe(obj);
		expect(walked2).toEqual(cpyObj);

		const walked3 = MiscUtil.getWalker().walk(obj, {});
		expect(obj).toEqual(cpyObj);
		expect(walked3).toBe(obj);
		expect(walked2).toEqual(cpyObj);

		const walked4 = MiscUtil.getWalker().walk(obj, handlers);
		expect(obj).toEqual(cpyObj);
		expect(walked3).toBe(obj);
		expect(walked4).toEqual({
			a: 2,
			b: [4, 6, -2],
			c: {
				d: 8,
				h: -4,
			},
			e: [
				[undefined, null, 10, 12, -2],
				{
					f: 14,
					g: 16,
					h: -4,
				},
				-2,
			],
			h: -4,
		});
	},
);

test(
	"Test multiple handlers",
	() => {
		const obj = {
			a: "foo",
			b: 2,
		};
		const cpyObj = MiscUtil.copyFast(obj);

		const handlers1 = {
			number: [
				num => num * 2,
				num => num - 1,
			],
			string: [
				() => {},
				() => {},
			],
		};

		const walked1 = MiscUtil.getWalker({isNoModification: true}).walk(obj, handlers1);
		expect(obj).toEqual(cpyObj);
		expect(walked1).toBe(obj);
		expect(walked1).toEqual(cpyObj);

		const walked2 = MiscUtil.getWalker().walk(obj, handlers1);
		expect(walked2).toEqual({
			a: undefined,
			b: 3,
		});

		const handlers2 = {
			string: [
				// region Throw error when `isModify`, as we do not return a `str`
				str => {
					void str.length;
				},
				str => {
					void str.length;
				},
				// endregion
			],
		};

		const walked3 = MiscUtil.getWalker({isNoModification: true}).walk(MiscUtil.copyFast(cpyObj), handlers2);
		expect(walked3).toEqual(cpyObj);
	},
);

test(
	"Test pre/post object",
	() => {
		const obj = {
			a: {
				id: "a",
				aa: 1,
			},
			b: {
				id: "b",
				bb: 2,
			},
		};
		const cpyObj = MiscUtil.copyFast(obj);

		const stack = [];
		const stackSnapshots = [];
		const handlers = {
			preObject: (obj) => {
				if (obj.id) stack.push(obj.id);
			},
			object: (obj) => {
				if (stack.length) stackSnapshots.push([...stack]);
			},
			postObject: (obj) => {
				if (obj.id) stack.pop();
			},
		};

		const walked1 = MiscUtil.getWalker({isNoModification: true}).walk(obj, handlers);
		expect(obj).toEqual(cpyObj);
		expect(walked1).toBe(obj);
		expect(walked1).toEqual(cpyObj);

		expect(stackSnapshots).toEqual([
			["a"],
			["b"],
		]);
	},
);
