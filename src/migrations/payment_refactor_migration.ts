import mongoose from 'mongoose';
import RentLedger from '../models/RentLedger';
import PaymentTransaction from '../models/PaymentTransaction';
import RentLedgerService from '../services/RentLedgerService';

/**
 * Migration Script for Payment Architecture Refactor
 * 1. Embeds ExtraCharge records into RentLedger
 * 2. Migrates Payment records to PaymentTransaction
 * 3. Recalculates all RentLedger totals
 */
export async function runPaymentMigration() {
  console.log('Starting Payment Migration...');

  // 1. Get all ExtraCharges
  // Note: Since we deleted the model file, we need to define it locally for the migration
  const ExtraChargeSchema = new mongoose.Schema({
    rentLedgerId: { type: mongoose.Schema.Types.ObjectId, ref: 'RentLedger' },
    chargeType: String,
    amount: Number,
    description: String,
    createdAt: Date
  });
  const OldExtraCharge = mongoose.models.ExtraCharge || mongoose.model('ExtraCharge', ExtraChargeSchema);

  const extraCharges = await OldExtraCharge.find({});
  console.log(`Found ${extraCharges.length} extra charges to migrate.`);

  for (const ec of extraCharges) {
    const ledger = await RentLedger.findById(ec.rentLedgerId);
    if (ledger) {
      ledger.extraCharges.push({
        title: ec.description || ec.chargeType,
        type: ec.chargeType as any,
        amount: ec.amount,
        description: ec.description,
        createdAt: ec.createdAt || new Date()
      });
      await ledger.save();
    }
  }
  console.log('Extra charges embedded.');

  // 2. Get all Payments
  const PaymentSchema = new mongoose.Schema({
    rentLedgerId: mongoose.Schema.Types.ObjectId,
    tenantId: mongoose.Schema.Types.ObjectId,
    propertyId: mongoose.Schema.Types.ObjectId,
    amount: Number,
    paymentMethod: String,
    status: String,
    paidAt: Date,
    referenceNumber: String,
    utrNumber: String,
    paymentScreenshotUrl: String,
    notes: String,
    createdById: mongoose.Schema.Types.ObjectId
  });
  const OldPayment = mongoose.models.Payment || mongoose.model('Payment', PaymentSchema);

  const payments = await OldPayment.find({});
  console.log(`Found ${payments.length} payments to migrate.`);

  for (const p of payments) {
    // Check if transaction already exists (avoid duplicates)
    const exists = await PaymentTransaction.findOne({
      rentLedgerId: p.rentLedgerId,
      amount: p.amount,
      paidAt: p.paidAt,
      utrNumber: p.utrNumber
    });

    if (!exists) {
      await PaymentTransaction.create({
        rentLedgerId: p.rentLedgerId,
        tenantId: p.tenantId,
        propertyId: p.propertyId,
        amount: p.amount,
        paymentMethod: p.paymentMethod as any,
        status: p.status === 'approved' ? 'approved' : p.status === 'rejected' ? 'rejected' : 'pending',
        paymentType: 'rent',
        referenceNumber: p.referenceNumber,
        utrNumber: p.utrNumber,
        paymentScreenshotUrl: p.paymentScreenshotUrl,
        notes: p.notes,
        paidAt: p.paidAt || new Date(),
        createdById: p.createdById
      });
    }
  }
  console.log('Payments migrated to PaymentTransaction.');

  // 3. Recalculate all Ledgers
  const ledgers = await RentLedger.find({});
  console.log(`Recalculating ${ledgers.length} ledgers...`);

  for (const ledger of ledgers) {
    await RentLedgerService.recalculateLedger(ledger._id.toString());
  }

  console.log('Migration complete.');
}
