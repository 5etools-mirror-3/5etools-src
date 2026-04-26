const _BASE_MIGRATION_VERSION = 0;

/**
 * @abstract
 */
class _DmScreenMigrationBase {
	_version;

	mutMigrat (save) {
		save.mv ||= _BASE_MIGRATION_VERSION;
		if (save.mv >= this._version) return false;
		this._mutMigrate(save);
		save.mv = this._version;
		return true;
	}

	/**
	 * @abstract
	 * @return void
	 */
	_mutMigrate (save) { throw new Error("Unimplemented!"); }
}

class _DmScreenMigrationVersion1 extends _DmScreenMigrationBase {
	_version = 1;

	_mutMigrate (save) {
		// save slot active
		save.sla = "1";
		// save slot states
		save.sls = {
			[save.sla]: {
				ps: save.ps,
				ex: save.ex,
			},
		};
		delete save.ps;
		delete save.ex;
	}
}

export class DmScreenMigrator {
	static _MIGRATORS = [
		new _DmScreenMigrationVersion1(),
	];

	static get CURRENT_MIGRATION_VERSION () {
		return this._MIGRATORS.at(-1)._version;
	}

	mutMigrateSave (save) {
		if (!save) return false;

		let isAnyMigrate = false;
		this.constructor._MIGRATORS
			.forEach(migrator => {
				const isMigrate = migrator.mutMigrat(save);
				isAnyMigrate ||= isMigrate;
			});

		return isAnyMigrate;
	}

	isCombinableSave (save) {
		if (!save) return false;

		return (save.mv || _BASE_MIGRATION_VERSION) === _BASE_MIGRATION_VERSION;
	}

	getCombinableSave (save) {
		const cpySave = MiscUtil.copyFast(save);
		this.mutMigrateSave(cpySave);

		return cpySave.sls[cpySave.sla];
	}
}
