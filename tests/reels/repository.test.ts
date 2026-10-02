import { PostsRepository } from '../../libraries/nestjs-libraries/src/database/prisma/posts/posts.repository';

jest.mock('@gitroom/nestjs-libraries/database/prisma/prisma.service', () => ({
  PrismaRepository: class {},
}));

it('restricts draft reads to the active workspace, including the connected account', async () => {
  const findMany = jest.fn().mockResolvedValue([]);
  const repository = new PostsRepository(
    { model: { post: { findMany } } } as any,
    null as any,
    null as any,
    null as any,
    null as any,
    null as any
  );
  await repository.getReelDrafts('workspace-a', 'post-in-another-workspace');
  const query = findMany.mock.calls[0][0];
  expect(query.where).toEqual(
    expect.objectContaining({
      id: 'post-in-another-workspace',
      organizationId: 'workspace-a',
      state: 'DRAFT',
      deletedAt: null,
      parentPostId: null,
    })
  );
  expect(query.where.integration).toEqual(
    expect.objectContaining({ organizationId: 'workspace-a', deletedAt: null })
  );
  expect(Object.keys(query.select.integration.select)).toEqual([
    'name',
    'profile',
    'providerIdentifier',
  ]);
  expect(query.select).not.toHaveProperty('organization');
});
