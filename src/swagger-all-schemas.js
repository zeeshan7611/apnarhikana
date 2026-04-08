/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       required:
 *         - name
 *         - email
 *       properties:
 *         _id:
 *           type: string
 *           description: MongoDB ObjectId
 *         name:
 *           type: string
 *           description: User's name
 *         email:
 *           type: string
 *           description: User's email address
 *         isActive:
 *           type: boolean
 *           description: User active status
 *       example:
 *         _id: 6613e7c2b1e4a2a1b2c3d4e5
 *         name: John Doe
 *         email: john@example.com
 *         isActive: true
 *     Property:
 *       type: object
 *       required:
 *         - name
 *       properties:
 *         _id:
 *           type: string
 *         name:
 *           type: string
 *           description: Property name
 *         address:
 *           type: string
 *           description: Property address
 *         isActive:
 *           type: boolean
 *           description: Property active status
 *       example:
 *         _id: 6613e7c2b1e4a2a1b2c3d4e5
 *         name: My Property
 *         address: 123 Main St
 *         isActive: true
 *     Floor:
 *       type: object
 *       required:
 *         - name
 *         - propertyId
 *       properties:
 *         _id:
 *           type: string
 *         name:
 *           type: string
 *           description: Floor name
 *         propertyId:
 *           type: string
 *           description: Reference to Property
 *         isActive:
 *           type: boolean
 *           description: Floor active status
 *       example:
 *         _id: 6613e7c2b1e4a2a1b2c3d4e5
 *         name: First Floor
 *         propertyId: 6613e7c2b1e4a2a1b2c3d4e5
 *         isActive: true
 *     Bed:
 *       type: object
 *       required:
 *         - name
 *         - roomId
 *       properties:
 *         _id:
 *           type: string
 *         name:
 *           type: string
 *           description: Bed name
 *         roomId:
 *           type: string
 *           description: Reference to Room
 *         isActive:
 *           type: boolean
 *           description: Bed active status
 *       example:
 *         _id: 6613e7c2b1e4a2a1b2c3d4e5
 *         name: Bed 1
 *         roomId: 6613e7c2b1e4a2a1b2c3d4e5
 *         isActive: true
 *     Allocation:
 *       type: object
 *       required:
 *         - propertyId
 *         - floorId
 *         - roomId
 *         - beds
 *         - tenantId
 *         - checkInDate
 *         - priceDetails
 *       properties:
 *         _id:
 *           type: string
 *         propertyId:
 *           type: string
 *         floorId:
 *           type: string
 *         roomId:
 *           type: string
 *         beds:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               bedId:
 *                 type: string
 *               bedName:
 *                 type: string
 *         tenantId:
 *           type: string
 *         checkInDate:
 *           type: string
 *           format: date
 *         checkOutDate:
 *           type: string
 *           format: date
 *         priceDetails:
 *           type: object
 *           properties:
 *             rentAmount:
 *               type: number
 *             advanceAmount:
 *               type: number
 *             securityDeposit:
 *               type: number
 *             maintenanceFee:
 *               type: number
 *             otherCharges:
 *               type: number
 *             totalAmount:
 *               type: number
 *             paymentFrequency:
 *               type: string
 *               enum: [monthly, quarterly, yearly]
 *         notes:
 *           type: string
 *         status:
 *           type: string
 *           enum: [active, inactive, terminated]
 *       example:
 *         _id: 6613e7c2b1e4a2a1b2c3d4e5
 *         propertyId: 6613e7c2b1e4a2a1b2c3d4e5
 *         floorId: 6613e7c2b1e4a2a1b2c3d4e5
 *         roomId: 6613e7c2b1e4a2a1b2c3d4e5
 *         beds:
 *           - bedId: 6613e7c2b1e4a2a1b2c3d4e5
 *             bedName: Bed 1
 *         tenantId: 123456
 *         checkInDate: 2026-04-08
 *         checkOutDate: 2026-05-08
 *         priceDetails:
 *           rentAmount: 10000
 *           advanceAmount: 2000
 *           securityDeposit: 5000
 *           maintenanceFee: 500
 *           otherCharges: 0
 *           totalAmount: 17500
 *           paymentFrequency: monthly
 *         notes: "Special request"
 *         status: active
 */
