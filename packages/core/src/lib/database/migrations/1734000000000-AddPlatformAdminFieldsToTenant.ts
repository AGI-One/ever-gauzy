import { MigrationInterface, QueryRunner, TableColumn, TableForeignKey } from 'typeorm';

export class AddPlatformAdminFieldsToTenant1734000000000 implements MigrationInterface {
	name = 'AddPlatformAdminFieldsToTenant1734000000000';

	public async up(queryRunner: QueryRunner): Promise<void> {
		// Add expiresAt column
		await queryRunner.addColumn(
			'tenant',
			new TableColumn({
				name: 'expiresAt',
				type: 'timestamp',
				isNullable: true
			})
		);

		// Add createdById column
		await queryRunner.addColumn(
			'tenant',
			new TableColumn({
				name: 'createdById',
				type: 'uuid',
				isNullable: true
			})
		);

		// Create index on expiresAt
		await queryRunner.query(`CREATE INDEX "IDX_tenant_expiresAt" ON "tenant" ("expiresAt")`);

		// Create index on createdById
		await queryRunner.query(`CREATE INDEX "IDX_tenant_createdById" ON "tenant" ("createdById")`);

		// Add foreign key for createdById
		await queryRunner.createForeignKey(
			'tenant',
			new TableForeignKey({
				columnNames: ['createdById'],
				referencedColumnNames: ['id'],
				referencedTableName: 'user',
				onDelete: 'SET NULL'
			})
		);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		// Drop foreign key
		const table = await queryRunner.getTable('tenant');
		const foreignKey = table?.foreignKeys.find((fk) => fk.columnNames.indexOf('createdById') !== -1);
		if (foreignKey) {
			await queryRunner.dropForeignKey('tenant', foreignKey);
		}

		// Drop indexes
		await queryRunner.query(`DROP INDEX "IDX_tenant_createdById"`);
		await queryRunner.query(`DROP INDEX "IDX_tenant_expiresAt"`);

		// Drop columns
		await queryRunner.dropColumn('tenant', 'createdById');
		await queryRunner.dropColumn('tenant', 'expiresAt');
	}
}
