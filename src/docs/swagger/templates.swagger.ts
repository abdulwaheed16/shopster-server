/**
 * @swagger
 * /templates/my:
 *   get:
 *     summary: Get user's templates
 *     description: Returns templates assigned to the current user.
 *     tags: [Templates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: categoryId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User templates retrieved successfully
 */

/**
 * @swagger
 * /templates/global:
 *   get:
 *     summary: Get global templates
 *     description: Returns templates available to all users.
 *     tags: [Templates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: categoryId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Global templates retrieved successfully
 */

/**
 * @swagger
 * /templates:
 *   get:
 *     summary: Get all templates
 *     description: Returns a paginated list of ad templates.
 *     tags: [Templates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: categoryId
 *         schema:
 *           type: string
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: Templates retrieved successfully
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /templates/preview:
 *   post:
 *     summary: Generate template preview
 *     description: Generates a preview image for a specific template.
 *     tags: [Templates]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [templateId]
 *             properties:
 *               templateId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Preview generated successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Template not found
 */

/**
 * @swagger
 * /templates/{id}:
 *   get:
 *     summary: Get template by ID
 *     description: Returns details of a specific template.
 *     tags: [Templates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Template retrieved successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Template not found
 */

/**
 * @swagger
 * /templates:
 *   post:
 *     summary: Create a template
 *     description: Creates a new ad template.
 *     tags: [Templates]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TemplateInput'
 *     responses:
 *       201:
 *         description: Template created successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /templates/{id}:
 *   put:
 *     summary: Update template
 *     description: Updates the information profile of a specific template.
 *     tags: [Templates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TemplateUpdateInput'
 *     responses:
 *       200:
 *         description: Template updated successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Template not found
 */

/**
 * @swagger
 * /templates/my/{id}:
 *   put:
 *     summary: Update own template
 *     description: Updates a template owned by the current user.
 *     tags: [Templates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TemplateUpdateInput'
 *     responses:
 *       200:
 *         description: Template updated successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Template not found or access denied
 */

/**
 * @swagger
 * /templates/{id}:
 *   delete:
 *     summary: Delete template
 *     description: Deletes a specific template.
 *     tags: [Templates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Template deleted successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Template not found
 */

/**
 * @swagger
 * /templates/my/{id}:
 *   delete:
 *     summary: Delete own template
 *     description: Deletes a specific template owned by the current user.
 *     tags: [Templates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Template deleted successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Template not found
 */

/**
 * @swagger
 * /templates/bulk-delete:
 *   post:
 *     summary: Bulk delete templates
 *     description: Deletes multiple templates at once.
 *     tags: [Templates]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               ids:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Templates deleted successfully
 *       401:
 *         description: Unauthorized
 */
