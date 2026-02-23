import { ApiError } from "../../../common/errors/api-error";
import { prisma } from "../../../config/database.config";

export class AssetFoldersService {
  /**
   * Create a new folder
   */
  async createFolder(
    userId: string,
    data: { name: string; parentId?: string },
  ) {
    return await prisma.assetFolder.create({
      data: {
        name: data.name,
        parentId: data.parentId,
        userId,
      },
    });
  }

  /**
   * Get folder tree for a user
   */
  async getFolderTree(userId: string) {
    const allFolders = await prisma.assetFolder.findMany({
      where: { userId },
      include: {
        _count: {
          select: { products: { where: { isActive: true } } },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    // Simple recursive tree building can be done on the frontend or here
    return allFolders;
  }

  /**
   * Rename a folder
   */
  async renameFolder(userId: string, folderId: string, name: string) {
    const folder = await prisma.assetFolder.findFirst({
      where: { id: folderId, userId },
    });

    if (!folder) throw ApiError.notFound("Folder not found");

    return await prisma.assetFolder.update({
      where: { id: folderId },
      data: { name },
    });
  }

  /**
   * Delete a folder (optionally recursive or move items to parent/root)
   */
  async deleteFolder(
    userId: string,
    folderId: string,
    mode: "relocate" | "recursive" = "relocate",
  ) {
    const folder = await prisma.assetFolder.findFirst({
      where: { id: folderId, userId },
    });

    if (!folder) throw ApiError.notFound("Folder not found");

    if (mode === "relocate") {
      // Move direct products to parent folder (or root)
      await prisma.product.updateMany({
        where: { folderId },
        data: { folderId: folder.parentId },
      });

      // Move child folders up to the parent of the deleted folder
      await prisma.assetFolder.updateMany({
        where: { parentId: folderId },
        data: { parentId: folder.parentId },
      });
    } else {
      // Recursive delete: Soft delete products and delete folders recursively
      // 1. Get all nested subfolder IDs
      const getAllChildFolderIds = async (pId: string): Promise<string[]> => {
        const children = await prisma.assetFolder.findMany({
          where: { parentId: pId, userId },
          select: { id: true },
        });

        let ids = children.map((c) => c.id);
        for (const child of children) {
          const subIds = await getAllChildFolderIds(child.id);
          ids = [...ids, ...subIds];
        }
        return ids;
      };

      const nestedFolderIds = await getAllChildFolderIds(folderId);
      const allTargetFolderIds = [folderId, ...nestedFolderIds];

      // 2. Soft delete ALL products in these folders
      await prisma.product.updateMany({
        where: {
          folderId: { in: allTargetFolderIds },
          userId,
        },
        data: { isActive: false },
      });

      // 3. Delete all folders (subfolders first if we didn't use cascading, but Prisma handle it if configured,
      // here we do it manually to be safe or just delete all at once if they have no other relations)
      await prisma.assetFolder.deleteMany({
        where: { id: { in: allTargetFolderIds }, userId },
      });

      return { deletedFolders: allTargetFolderIds.length };
    }

    return await prisma.assetFolder.delete({
      where: { id: folderId },
    });
  }

  /**
   * Move products to a folder
   */
  async moveProducts(
    userId: string,
    productIds: string[],
    folderId: string | null,
  ) {
    // Verify ownership of products
    const products = await prisma.product.findMany({
      where: {
        id: { in: productIds },
        OR: [{ userId }, { store: { userId } }],
      },
      select: { id: true },
    });

    const validIds = products.map((p) => p.id);

    if (folderId) {
      const folder = await prisma.assetFolder.findFirst({
        where: { id: folderId, userId },
      });
      if (!folder) throw ApiError.notFound("Target folder not found");
    }

    return await prisma.product.updateMany({
      where: { id: { in: validIds } },
      data: { folderId },
    });
  }

  /**
   * Move a folder to a new parent or to root
   */
  async moveFolder(userId: string, folderId: string, parentId: string | null) {
    // 1. Verify ownership of moving folder
    const folder = await prisma.assetFolder.findFirst({
      where: { id: folderId, userId },
    });
    if (!folder) throw ApiError.notFound("Folder not found");

    // 2. If moving to a parent, verify parent exists and belongs to user
    if (parentId) {
      if (parentId === folderId)
        throw ApiError.badRequest("Cannot move folder into itself");

      const parent = await prisma.assetFolder.findFirst({
        where: { id: parentId, userId },
      });
      if (!parent) throw ApiError.notFound("Target parent folder not found");
    }

    return await prisma.assetFolder.update({
      where: { id: folderId },
      data: { parentId },
    });
  }
}

export const assetFoldersService = new AssetFoldersService();
