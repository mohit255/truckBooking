const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

function computePaymentStatus(payment) {
  const partyPending = Number(payment.paidByParty) < Number(payment.totalFromParty);
  const malikPending = Number(payment.paidToMalik) < Number(payment.amountPayableMalik);
  if (!partyPending && !malikPending) return 'ALL_PAID';
  if (partyPending && !malikPending) return 'PARTY_PENDING';
  if (!partyPending && malikPending) return 'MALIK_PENDING';
  return 'PARTY_PENDING';
}

exports.listPayments = async (req, res) => {
  const { 
    fromDate, 
    toDate, 
    partyName, 
    paymentStatus, 
    minAmount, 
    maxAmount,
    minCommission,
    maxCommission,
    q 
  } = req.query;
  
  const where = {
    AND: [
      fromDate ? { 
        booking: { 
          bookingDate: { 
            gte: new Date(fromDate) 
          } 
        } 
      } : {},
      toDate ? { 
        booking: { 
          bookingDate: { 
            lte: new Date(toDate + 'T23:59:59.999Z') 
          } 
        } 
      } : {},
      partyName ? { 
        booking: { 
          partyName: { 
            contains: partyName.trim() 
          } 
        } 
      } : {},
      paymentStatus ? { paymentStatus } : {},
      minAmount ? { 
        totalFromParty: { 
          gte: Number(minAmount) 
        } 
      } : {},
      maxAmount ? { 
        totalFromParty: { 
          lte: Number(maxAmount) 
        } 
      } : {},
      minCommission ? { 
        commissionEarned: { 
          gte: Number(minCommission) 
        } 
      } : {},
      maxCommission ? { 
        commissionEarned: { 
          lte: Number(maxCommission) 
        } 
      } : {},
      q ? {
        OR: [
          { booking: { partyName: { contains: q.trim() } } },
          { booking: { malikName: { contains: q.trim() } } },
          { paymentStatus: { contains: q.trim() } }
        ]
      } : {}
    ]
  };
  
  const payments = await prisma.payment.findMany({ 
    where, 
    include: { 
      booking: {
        include: {
          sourceCity: true,
          destinationCity: true,
          vehicle: true
        }
      } 
    }, 
    orderBy: { id: 'desc' } 
  });
  
  // Calculate summary statistics
  const totalPayments = payments.length;
  const totalAmount = payments.reduce((sum, p) => sum + Number(p.totalFromParty || 0), 0);
  const totalCommission = payments.reduce((sum, p) => sum + Number(p.commissionEarned || 0), 0);
  const pendingPayments = payments.filter(p => p.paymentStatus !== 'ALL_PAID').length;
  
  // Calculate pending amounts
  const totalPartyPending = payments.reduce((sum, p) => {
    const partyPending = Number(p.totalFromParty || 0) - Number(p.paidByParty || 0);
    return sum + (partyPending > 0 ? partyPending : 0);
  }, 0);
  
  const totalMalikPending = payments.reduce((sum, p) => {
    const malikPending = Number(p.amountPayableMalik || 0) - Number(p.paidToMalik || 0);
    return sum + (malikPending > 0 ? malikPending : 0);
  }, 0);
  
  res.render('payments/index', { 
    payments, 
    query: req.query || {},
    stats: {
      totalPayments,
      totalAmount,
      totalCommission,
      pendingPayments,
      totalPartyPending,
      totalMalikPending
    }
  });
};

exports.viewPaymentByBooking = async (req, res) => {
  const bookingId = Number(req.params.bookingId);
  const payment = await prisma.payment.findUnique({ where: { bookingId }, include: { booking: true } });
  if (!payment) return res.status(404).send('Not found');
  res.render('payments/show', { payment });
};

exports.recordPartyPayment = async (req, res) => {
  try {
    const bookingId = Number(req.params.bookingId);
    const { amount } = req.body;
    const payment = await prisma.payment.findUnique({ where: { bookingId } });
    const updated = await prisma.payment.update({
      where: { bookingId },
      data: {
        paidByParty: Number(payment.paidByParty) + Number(amount)
      }
    });
    await prisma.payment.update({
      where: { bookingId },
      data: { paymentStatus: computePaymentStatus(updated) }
    });
    req.flash('success', 'Recorded party payment');
    res.redirect(`/payments/${bookingId}`);
  } catch (e) {
    console.error(e);
    req.flash('error', 'Failed to record payment');
    res.redirect('/payments');
  }
};

exports.recordMalikPayment = async (req, res) => {
  try {
    const bookingId = Number(req.params.bookingId);
    const { amount } = req.body;
    const payment = await prisma.payment.findUnique({ where: { bookingId } });
    const updated = await prisma.payment.update({
      where: { bookingId },
      data: {
        paidToMalik: Number(payment.paidToMalik) + Number(amount)
      }
    });
    await prisma.payment.update({
      where: { bookingId },
      data: { paymentStatus: computePaymentStatus(updated) }
    });
    req.flash('success', 'Recorded payment to malik');
    res.redirect(`/payments/${bookingId}`);
  } catch (e) {
    console.error(e);
    req.flash('error', 'Failed to record payment');
    res.redirect('/payments');
  }
};

exports.exportPayments = async (req, res) => {
  try {
    const { 
      fromDate, 
      toDate, 
      partyName, 
      paymentStatus, 
      minAmount, 
      maxAmount,
      minCommission,
      maxCommission,
      q 
    } = req.query;
    
    const where = {
      AND: [
        fromDate ? { 
          booking: { 
            bookingDate: { 
              gte: new Date(fromDate) 
            } 
          } 
        } : {},
        toDate ? { 
          booking: { 
            bookingDate: { 
              lte: new Date(toDate + 'T23:59:59.999Z') 
            } 
          } 
        } : {},
        partyName ? { 
          booking: { 
            partyName: { 
              contains: partyName.trim() 
            } 
          } 
        } : {},
        paymentStatus ? { paymentStatus } : {},
        minAmount ? { 
          totalFromParty: { 
            gte: Number(minAmount) 
          } 
        } : {},
        maxAmount ? { 
          totalFromParty: { 
            lte: Number(maxAmount) 
          } 
        } : {},
        minCommission ? { 
          commissionEarned: { 
            gte: Number(minCommission) 
          } 
        } : {},
        maxCommission ? { 
          commissionEarned: { 
            lte: Number(maxCommission) 
          } 
        } : {},
        q ? {
          OR: [
            { booking: { partyName: { contains: q.trim() } } },
            { booking: { malikName: { contains: q.trim() } } },
            { paymentStatus: { contains: q.trim() } }
          ]
        } : {}
      ]
    };
    
    const payments = await prisma.payment.findMany({ 
      where, 
      include: { 
        booking: {
          include: {
            sourceCity: true,
            destinationCity: true,
            vehicle: true
          }
        } 
      }, 
      orderBy: { id: 'desc' } 
    });
    
    const csvData = payments.map(p => ({
      'Payment ID': p.id,
      'Booking ID': p.bookingId,
      'Booking Date': new Date(p.booking.createdAt).toISOString().slice(0,10),
      'Party Name': p.booking.partyName || '',
      'Source City': p.booking.sourceCity?.name || '',
      'Destination City': p.booking.destinationCity?.name || '',
      'Vehicle Number': p.booking.vehicle?.vehicleNumber || '',
      'Total From Party': p.totalFromParty,
      'Paid By Party': p.paidByParty,
      'Party Pending': Number(p.totalFromParty) - Number(p.paidByParty),
      'Malik Payable': p.amountPayableMalik,
      'Paid To Malik': p.paidToMalik,
      'Malik Pending': Number(p.amountPayableMalik) - Number(p.paidToMalik),
      'Commission Earned': p.commissionEarned,
      'Payment Status': p.paymentStatus
    }));
    
    const csv = require('csv-stringify');
    csv.stringify(csvData, { header: true }, (err, output) => {
      if (err) {
        console.error('CSV generation error:', err);
        return res.status(500).send('Failed to generate CSV');
      }
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="payments_${new Date().toISOString().slice(0,10)}.csv"`);
      res.send(output);
    });
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).send('Export failed');
  }
};


