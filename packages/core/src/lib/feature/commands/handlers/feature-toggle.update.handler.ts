import { ForbiddenException } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { FeatureEnum, RolesEnum } from '@gauzy/contracts';
import { RequestContext } from '../../../core/context';
import { FeatureOrganizationService } from '../../../feature/feature-organization.service';
import { FeatureService } from '../../../feature/feature.service';
import { FeatureToggleUpdateCommand } from '../feature-toggle.update.command';

@CommandHandler(FeatureToggleUpdateCommand)
export class FeatureToggleUpdateHandler implements ICommandHandler<FeatureToggleUpdateCommand> {
	constructor(
		private readonly _featureOrganizationService: FeatureOrganizationService,
		private readonly _featureService: FeatureService
	) { }

	public async execute(command: FeatureToggleUpdateCommand): Promise<boolean> {
		const { input } = command;
		const { featureId } = input;

		// Get the feature to check if it's FEATURE_PLATFORM_ADMIN
		const feature = await this._featureService.findOneByIdString(featureId);

		// Check if this is the FEATURE_PLATFORM_ADMIN
		if (feature && feature.code === FeatureEnum.FEATURE_PLATFORM_ADMIN) {
			// Only PLATFORM_ADMIN role can toggle this feature
			const currentUser = RequestContext.currentUser();

			if (!currentUser || currentUser.role?.name !== RolesEnum.PLATFORM_ADMIN) {
				throw new ForbiddenException(
					'Only Platform Administrators can enable or disable the Platform Admin feature'
				);
			}
		}

		return await this._featureOrganizationService.updateFeatureOrganization(input);
	}
}
