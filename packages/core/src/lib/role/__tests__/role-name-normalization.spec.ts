import { Test, TestingModule } from '@nestjs/testing';
import { RoleService } from '../role.service';
import { TypeOrmRoleRepository } from '../repository/type-orm-role.repository';
import { MikroOrmRoleRepository } from '../repository/mikro-orm-role.repository';
import { CommandBus } from '@nestjs/cqrs';

describe('Role Name Normalization', () => {
    let service: RoleService;
    let mockTypeOrmRepo: any;
    let mockMikroOrmRepo: any;
    let mockCommandBus: any;

    beforeEach(async () => {
        // Mock repositories
        mockTypeOrmRepo = {
            save: jest.fn((entity) => Promise.resolve({ id: '123', ...entity })),
            findOne: jest.fn(),
            update: jest.fn()
        };

        mockMikroOrmRepo = {
            save: jest.fn(),
            findOne: jest.fn()
        };

        mockCommandBus = {
            execute: jest.fn()
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                RoleService,
                {
                    provide: TypeOrmRoleRepository,
                    useValue: mockTypeOrmRepo
                },
                {
                    provide: MikroOrmRoleRepository,
                    useValue: mockMikroOrmRepo
                },
                {
                    provide: CommandBus,
                    useValue: mockCommandBus
                }
            ]
        }).compile();

        service = module.get<RoleService>(RoleService);
    });

    describe('create()', () => {
        it('should normalize "Platform Admin" to "PLATFORM_ADMIN"', async () => {
            const input = { name: 'Platform Admin', tenantId: 'tenant-123' };

            await service.create(input);

            expect(mockTypeOrmRepo.save).toHaveBeenCalledWith(
                expect.objectContaining({
                    name: 'PLATFORM_ADMIN'
                })
            );
        });

        it('should normalize "admin" to "ADMIN"', async () => {
            const input = { name: 'admin', tenantId: 'tenant-123' };

            await service.create(input);

            expect(mockTypeOrmRepo.save).toHaveBeenCalledWith(
                expect.objectContaining({
                    name: 'ADMIN'
                })
            );
        });

        it('should normalize "sales manager" to "SALES_MANAGER"', async () => {
            const input = { name: 'sales manager', tenantId: 'tenant-123' };

            await service.create(input);

            expect(mockTypeOrmRepo.save).toHaveBeenCalledWith(
                expect.objectContaining({
                    name: 'SALES_MANAGER'
                })
            );
        });

        it('should normalize "Account  Manager" (multiple spaces) to "ACCOUNT_MANAGER"', async () => {
            const input = { name: 'Account  Manager', tenantId: 'tenant-123' };

            await service.create(input);

            expect(mockTypeOrmRepo.save).toHaveBeenCalledWith(
                expect.objectContaining({
                    name: 'ACCOUNT_MANAGER'
                })
            );
        });

        it('should keep "ACCOUNTANT" as "ACCOUNTANT"', async () => {
            const input = { name: 'ACCOUNTANT', tenantId: 'tenant-123' };

            await service.create(input);

            expect(mockTypeOrmRepo.save).toHaveBeenCalledWith(
                expect.objectContaining({
                    name: 'ACCOUNTANT'
                })
            );
        });

        it('should trim whitespace from " HR Manager "', async () => {
            const input = { name: '  HR Manager  ', tenantId: 'tenant-123' };

            await service.create(input);

            expect(mockTypeOrmRepo.save).toHaveBeenCalledWith(
                expect.objectContaining({
                    name: 'HR_MANAGER'
                })
            );
        });
    });

    describe('update()', () => {
        it('should normalize role name on update', async () => {
            const id = 'role-123';
            const input = { name: 'Super Admin' };

            mockTypeOrmRepo.update = jest.fn().mockResolvedValue({ affected: 1 });
            mockTypeOrmRepo.findOne = jest.fn().mockResolvedValue({
                id,
                name: 'SUPER_ADMIN',
                tenantId: 'tenant-123'
            });

            await service.update(id, input);

            // Verify that the update was called with normalized name
            expect(input.name).toBe('SUPER_ADMIN');
        });
    });
});
