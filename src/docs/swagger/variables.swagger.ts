/**
 * @swagger
 * /variables:
 *   get:
 *     summary: Get all variables
 *     description: Returns a paginated list of ad prompt variables.
 *     tags: [Variables]
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
 *         name: type
 *         schema:
 *           type: string
 *           enum: [TEXT, TEXTAREA, NUMBER, SELECT, COLOR, IMAGE_URL]
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Variables retrieved successfully
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /variables/{id}:
 *   get:
 *     summary: Get variable by ID
 *     description: Returns details of a specific variable.
 *     tags: [Variables]
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
 *         description: Variable retrieved successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Variable not found
 */

/**
 * @swagger
 * /variables/{id}/usage:
 *   get:
 *     summary: Get variable usage tracking
 *     description: Returns details of where the variable is used.
 *     tags: [Variables]
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
 *         description: Usage details retrieved successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Variable not found
 */

/**
 * @swagger
 * /variables:
 *   post:
 *     summary: Create a variable
 *     description: Creates a new ad prompt variable.
 *     tags: [Variables]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, label, type]
 *             properties:
 *               name:
 *                 type: string
 *               label:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [TEXT, TEXTAREA, NUMBER, SELECT, COLOR, IMAGE_URL]
 *               placeholder:
 *                 type: string
 *               defaultValue:
 *                 type: string
 *               required:
 *                 type: boolean
 *               validation:
 *                 type: object
 *     responses:
 *       201:
 *         description: Variable created successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /variables/{id}:
 *   put:
 *     summary: Update variable
 *     description: Updates the information of a specific variable.
 *     tags: [Variables]
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
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               label:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [TEXT, TEXTAREA, NUMBER, SELECT, COLOR, IMAGE_URL]
 *               placeholder:
 *                 type: string
 *               defaultValue:
 *                 type: string
 *               required:
 *                 type: boolean
 *               validation:
 *                 type: object
 *     responses:
 *       200:
 *         description: Variable updated successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Variable not found
 */

/**
 * @swagger
 * /variables/{id}:
 *   delete:
 *     summary: Delete variable
 *     description: Deletes a specific variable.
 *     tags: [Variables]
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
 *         description: Variable deleted successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Variable not found
 */
