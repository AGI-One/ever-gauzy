import { MigrationInterface, QueryRunner } from 'typeorm';
import * as chalk from 'chalk';

/**
 * Migration to normalize existing role names to UPPERCASE with underscores
 * This ensures all custom roles follow the naming convention
 */
export class NormalizeExistingRoleNames9999999999999 implements MigrationInterface {
    name = 'NormalizeExistingRoleNames9999999999999';

    /**
     * Up Migration - Normalize role names
     *
     * @param queryRunner
     */
    public async up(queryRunner: QueryRunner): Promise<void> {
        console.log(chalk.yellow(this.name + ' start running!'));

        // Get all roles with non-normalized names (contains lowercase or spaces)
        const roles = await queryRunner.query(`
			SELECT id, name, "tenantId", "isSystem"
			FROM "role"
			WHERE name != UPPER(name)
			   OR name LIKE '% %'
		`);

        console.log(chalk.blue(`Found ${roles.length} roles to normalize`));

        // Normalize each role name
        for (const role of roles) {
            const oldName = role.name;
            const newName = oldName
                .trim()
                .toUpperCase()
                .replace(/\s+/g, '_');

            // Check if normalized name already exists for this tenant
            const existingRole = await queryRunner.query(
                `
				SELECT id FROM "role"
				WHERE name = $1
				  AND "tenantId" = $2
				  AND id != $3
			`,
                [newName, role.tenantId, role.id]
            );

            if (existingRole.length > 0) {
                console.log(
                    chalk.yellow(
                        `⚠️  Skipping role "${oldName}" (ID: ${role.id}) - ` +
                        `Normalized name "${newName}" already exists for tenant ${role.tenantId}`
                    )
                );
                continue;
            }

            // Update role name
            await queryRunner.query(
                `
				UPDATE "role"
				SET name = $1
				WHERE id = $2
			`,
                [newName, role.id]
            );

            console.log(
                chalk.green(`✓ Normalized: "${oldName}" → "${newName}" (ID: ${role.id}, System: ${role.isSystem})`)
            );
        }

        console.log(chalk.green(this.name + ' finished!'));
    }

    /**
     * Down Migration - Revert not supported
     * Cannot reliably revert to original case/spacing
     *
     * @param queryRunner
     */
    public async down(queryRunner: QueryRunner): Promise<void> {
        console.log(chalk.yellow('⚠️  Down migration not supported for role name normalization'));
        console.log(chalk.yellow('Original role names were not preserved'));
    }
}
