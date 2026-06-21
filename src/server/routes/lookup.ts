import { Router, Request, Response } from 'express';

const router = Router();

// POST /api/lookup/pnr
router.post('/pnr', async (req: Request, res: Response): Promise<void> => {
  try {
    const { pnr } = req.body;
    if (!pnr) {
      res.status(400).json({ error: 'pnr is required' });
      return;
    }
    
    // Deterministic mock based on PNR to give different results for different PNRs
    const trainRoutes = [
      { route: "New Delhi → Amritsar", name: "Shatabdi Express", dist: 446 },
      { route: "Mumbai CSMT → Pune", name: "Deccan Queen", dist: 192 },
      { route: "Bengaluru → Chennai", name: "Shatabdi Express", dist: 350 },
      { route: "Howrah → Patna", name: "Vande Bharat", dist: 532 },
      { route: "Ahmedabad → Mumbai", name: "Tejas Express", dist: 490 }
    ];
    // Simple hash of PNR string
    const hash = pnr.split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
    const selected = trainRoutes[hash % trainRoutes.length];

    res.status(200).json({
      route: selected.route,
      trainName: selected.name,
      distanceKm: selected.dist
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to lookup PNR' });
  }
});

// POST /api/lookup/flight
router.post('/flight', async (req: Request, res: Response): Promise<void> => {
  try {
    const { flightNumber } = req.body;
    if (!flightNumber) {
      res.status(400).json({ error: 'flightNumber is required' });
      return;
    }

    const upper = flightNumber.toUpperCase();
    let airline = "Generic Airlines";
    if (upper.startsWith('6E')) airline = "IndiGo";
    else if (upper.startsWith('AI')) airline = "Air India";
    else if (upper.startsWith('UK')) airline = "Vistara";
    else if (upper.startsWith('SG')) airline = "SpiceJet";
    else if (upper.startsWith('QP')) airline = "Akasa Air";
    else if (upper.startsWith('I5')) airline = "AIX Connect";

    // Generate deterministic mock based on flight number hash
    const flightRoutes = [
      { route: "Delhi (DEL) → Mumbai (BOM)", dist: 1148 },
      { route: "Bengaluru (BLR) → Delhi (DEL)", dist: 1740 },
      { route: "Mumbai (BOM) → Goa (GOI)", dist: 425 },
      { route: "Kolkata (CCU) → Delhi (DEL)", dist: 1305 },
      { route: "Chennai (MAA) → Bengaluru (BLR)", dist: 268 },
      { route: "Hyderabad (HYD) → Pune (PNQ)", dist: 504 }
    ];
    const hash = flightNumber.split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
    const selected = flightRoutes[hash % flightRoutes.length];

    res.status(200).json({
      route: selected.route,
      airline: airline,
      distanceKm: selected.dist
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to lookup flight' });
  }
});

export default router;
