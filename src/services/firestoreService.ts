import { User } from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  Unsubscribe,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import {
  Complaint,
  ComplaintEvent,
  ComplaintPriority,
  ComplaintStatus,
  NotificationItem,
  PromiseItem,
  UserProfile,
} from '../types/resolveloop';

const safeStr = (val: unknown, max: number, fallback = ''): string => {
  const s = typeof val === 'string' ? val.trim() : fallback;
  return s.slice(0, max);
};

const safeList = (arr: unknown, maxItems = 10, maxItemLen = 120): string[] => {
  if (!Array.isArray(arr)) return [];
  return arr
    .filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
    .slice(0, maxItems)
    .map((item) => item.trim().slice(0, maxItemLen));
};

function makeId(prefix: string): string {
  const rand = Math.random().toString(36).slice(2, 8);
  return `${prefix}_${Date.now()}_${rand}`.replace(/[^a-zA-Z0-9_-]/g, '');
}

export async function ensureUserAndSeedData(user: User): Promise<void> {
  const userPath = `users/${user.uid}`;
  try {
    const userRef = doc(db, 'users', user.uid);
    const snap = await getDoc(userRef);

    if (!snap.exists()) {
      await setDoc(userRef, {
        uid: user.uid,
        fullName: safeStr(user.displayName || 'Priya Sharma', 120, 'Priya Sharma'),
        email: safeStr(user.email || 'user@resolveloop.com', 180, 'user@resolveloop.com'),
        mobileNumber: '+91 99123 45678',
        dateOfBirth: '1998-08-14',
        occupation: 'Product Designer',
        location: 'Coimbatore, India',
        notifyEmail: true,
        notifySms: false,
        notifyPromise: true,
        notifyCommunity: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }

    const existingComplaints = await getDocs(
      query(collection(db, 'complaints'), where('userId', '==', user.uid))
    );

    if (existingComplaints.empty) {
      await seedStarterWorkspace(user.uid, user.displayName || 'Priya Sharma');
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, userPath);
  }
}

async function seedStarterWorkspace(uid: string, customerName: string): Promise<void> {
  const now = Date.now();
  const hoursFromNow = (h: number) => new Date(now + h * 3600 * 1000).toISOString();

  const starterComplaints = [
    {
      id: `cmp_0187_${uid.slice(0, 6)}`,
      ticketCode: '#CMP-0187',
      title: 'Damaged Laptop Received',
      category: 'Damaged Item',
      orderId: 'ORD-48213',
      description:
        'Inspection verified broken hinge and panel fracture during transit. Replacement or full refund requested with shipping box photo evidence.',
      priority: 'High' as ComplaintPriority,
      status: 'In Progress' as ComplaintStatus,
      currentStep: 4,
      assignedAgentName: 'Rahul Verma',
      assignedAgentRole: 'Support Billing Specialist',
      assignedAgentRating: 4.9,
      aiClassification: 'Hardware > Transit Damage',
      aiClarityScore: 91,
      aiSuggestion: 'Courier transit inspection verified; expedite replacement unit dispatch.',
      estimatedResolution: '2-3 working days',
      assignedTeam: 'Hardware Claims Team',
      attachments: ['damaged_hinge.jpg', 'invoice_48213.pdf'],
      latestUpdateNote: 'Tracing the replacement unit dispatch with the regional warehouse.',
      resolutionSummary: [
        'Screen and hinge verified damaged',
        'Courier transit claim approved',
        'Replacement unit QA inspected',
        'Priority dispatch scheduled',
      ],
      rating: 0,
      feedbackText: '',
      resolvedInDays: 3,
    },
    {
      id: `cmp_0199_${uid.slice(0, 6)}`,
      ticketCode: '#CMP-0199',
      title: 'Refund not received',
      category: 'Billing & Refunds',
      orderId: 'ORD-47901',
      description:
        'Requested a refund of $249.00 for cancelled order ORD-47901. The merchant confirmed cancellation, but credit has not posted after 12 business days.',
      priority: 'Medium' as ComplaintPriority,
      status: 'In Progress' as ComplaintStatus,
      currentStep: 3,
      assignedAgentName: 'Rahul Verma',
      assignedAgentRole: 'Support Billing Specialist',
      assignedAgentRating: 4.9,
      aiClassification: 'Billing > Refund Delay',
      aiClarityScore: 86,
      aiSuggestion: 'Recommends adding bank details to saved payment methods for expedited deposit.',
      estimatedResolution: '3-4 working days',
      assignedTeam: 'Billing Support Team',
      attachments: ['invoice.pdf', 'bank_stmt.png'],
      latestUpdateNote: 'Tracing the refund ARN trace reference with the payment gateway.',
      resolutionSummary: [
        'Cancellation confirmed by merchant',
        'Gateway ARN trace initiated',
        'Refund credited to original source',
      ],
      rating: 0,
      feedbackText: '',
      resolvedInDays: 4,
    },
    {
      id: `cmp_0204_${uid.slice(0, 6)}`,
      ticketCode: '#CMP-0204',
      title: 'Wrong Partner Delivered',
      category: 'Delivery Issue',
      orderId: 'ORD-48510',
      description:
        'Package handed over to incorrect regional hub and marked out for delivery under an unassigned courier manifest.',
      priority: 'Medium' as ComplaintPriority,
      status: 'Resolved' as ComplaintStatus,
      currentStep: 6,
      assignedAgentName: 'Ananya Nair',
      assignedAgentRole: 'Logistics Lead',
      assignedAgentRating: 4.8,
      aiClassification: 'Logistics > Partner Routing',
      aiClarityScore: 94,
      aiSuggestion: 'Rerouted via priority local hub and verified OTP delivery.',
      estimatedResolution: '1-2 working days',
      assignedTeam: 'Logistics Escalation Desk',
      attachments: ['tracking_log.png'],
      latestUpdateNote: 'Delivered and signed with OTP verification.',
      resolutionSummary: [
        'Misrouted manifest intercepted',
        'Assigned verified local partner',
        'Delivered with customer OTP',
      ],
      rating: 5,
      feedbackText: 'Fast reroute and transparent live updates.',
      resolvedInDays: 2,
    },
    {
      id: `cmp_0162_${uid.slice(0, 6)}`,
      ticketCode: '#CMP-0162',
      title: 'Broken Headphones Audio Jack',
      category: 'Damaged Item',
      orderId: 'ORD-46119',
      description:
        'Studio headphones arrived with intermittent left-channel audio and bent connector housing. Replacement unit tested and awaiting customer sign-off.',
      priority: 'High' as ComplaintPriority,
      status: 'Awaiting Confirmation' as ComplaintStatus,
      currentStep: 6,
      assignedAgentName: 'Rahul Verma',
      assignedAgentRole: 'Support Expert',
      assignedAgentRating: 4.9,
      aiClassification: 'Hardware > Defect On Arrival',
      aiClarityScore: 89,
      aiSuggestion: 'Verify audio balance on replacement pair before closing ticket.',
      estimatedResolution: '2 working days',
      assignedTeam: 'Quality Assurance Team',
      attachments: ['unboxing_photo.jpg'],
      latestUpdateNote: 'Replacement headphones delivered. Please confirm if your issue is resolved.',
      resolutionSummary: [
        'Audio hardware defect confirmed',
        'Replacement unit QA tested',
        'Accessory cable & adapter included',
        'Replacement package delivered',
      ],
      rating: 5,
      feedbackText: '',
      resolvedInDays: 3,
    },
    {
      id: `cmp_0153_${uid.slice(0, 6)}`,
      ticketCode: '#CMP-0153',
      title: 'Sealed Package Missing Accessories',
      category: 'Wrong Item',
      orderId: 'ORD-45890',
      description:
        'Refund credit approved to wallet after merchant acknowledged missing power adapter inside factory-sealed retail carton.',
      priority: 'High' as ComplaintPriority,
      status: 'Resolved' as ComplaintStatus,
      currentStep: 6,
      assignedAgentName: 'A. Sengupta',
      assignedAgentRole: 'Quality Lead',
      assignedAgentRating: 5.0,
      aiClassification: 'Fulfillment > Missing Component',
      aiClarityScore: 95,
      aiSuggestion: 'Instant wallet credit issued for missing accessory kit.',
      estimatedResolution: '1 working day',
      assignedTeam: 'Fulfillment Resolution Team',
      attachments: ['sealed_box.jpg'],
      latestUpdateNote: 'Wallet credit settled and confirmed.',
      resolutionSummary: [
        'Weight discrepancy verified at warehouse',
        'Instant credit issued to wallet',
        'Accessory kit voucher added',
      ],
      rating: 5,
      feedbackText: 'Resolved within 24 hours.',
      resolvedInDays: 1,
    },
    {
      id: `cmp_0211_${uid.slice(0, 6)}`,
      ticketCode: '#CMP-0211',
      title: 'Duplicate Subscription Charge',
      category: 'Billing & Refunds',
      orderId: 'SUB-99204',
      description:
        'Draft complaint noting two consecutive renewal debits on the same billing cycle statement.',
      priority: 'Low' as ComplaintPriority,
      status: 'Draft' as ComplaintStatus,
      currentStep: 1,
      assignedAgentName: 'Pending Assignment',
      assignedAgentRole: 'Billing Support',
      assignedAgentRating: 4.8,
      aiClassification: 'Billing > Duplicate Charge',
      aiClarityScore: 72,
      aiSuggestion: 'Attach both card statement transaction IDs before submitting.',
      estimatedResolution: '2-3 working days',
      assignedTeam: 'Billing Support Team',
      attachments: [],
      latestUpdateNote: 'Saved as draft. Complete details to submit.',
      resolutionSummary: [],
      rating: 0,
      feedbackText: '',
      resolvedInDays: 0,
    },
  ];

  // Create complaints sequentially first so exists()/get() rules pass for subcollections & linked docs
  for (const c of starterComplaints) {
    await setDoc(doc(db, 'complaints', c.id), {
      userId: uid,
      ticketCode: c.ticketCode,
      title: c.title,
      category: c.category,
      orderId: c.orderId,
      description: c.description,
      priority: c.priority,
      status: c.status,
      currentStep: c.currentStep,
      assignedAgentName: c.assignedAgentName,
      assignedAgentRole: c.assignedAgentRole,
      assignedAgentRating: c.assignedAgentRating,
      aiClassification: c.aiClassification,
      aiClarityScore: c.aiClarityScore,
      aiSuggestion: c.aiSuggestion,
      estimatedResolution: c.estimatedResolution,
      assignedTeam: c.assignedTeam,
      attachments: c.attachments,
      latestUpdateNote: c.latestUpdateNote,
      resolutionSummary: c.resolutionSummary,
      rating: c.rating,
      feedbackText: c.feedbackText,
      resolvedInDays: c.resolvedInDays,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }

  // Create initial timeline events for the active complaints
  const primaryId = starterComplaints[0].id;
  const secondId = starterComplaints[1].id;
  const awaitingId = starterComplaints[3].id;

  const eventsToCreate = [
    {
      complaintId: primaryId,
      id: `evt_1_${uid.slice(0, 6)}`,
      title: 'Complaint submitted',
      description: 'Your complaint was received successfully with transit photos.',
      senderType: 'customer',
      senderName: customerName,
      tag: 'Submitted',
    },
    {
      complaintId: primaryId,
      id: `evt_2_${uid.slice(0, 6)}`,
      title: 'AI Analysis Complete',
      description: 'Automatically triaged and routed to Hardware Claims Team.',
      senderType: 'ai',
      senderName: 'ResolveLoop AI',
      tag: 'Hardware — Transit Damage',
    },
    {
      complaintId: primaryId,
      id: `evt_3_${uid.slice(0, 6)}`,
      title: 'Support Staff Assigned',
      description: 'Rahul Verma from Support Billing & Claims is handling your case.',
      senderType: 'agent',
      senderName: 'Rahul Verma',
      tag: 'Assigned',
    },
    {
      complaintId: secondId,
      id: `evt_4_${uid.slice(0, 6)}`,
      title: 'Refund Trace Initiated',
      description: 'Hello, I have raised a trace request with the acquiring bank for ORD-47901.',
      senderType: 'agent',
      senderName: 'Rahul Verma',
      tag: 'Billing — Refund',
    },
    {
      complaintId: awaitingId,
      id: `evt_5_${uid.slice(0, 6)}`,
      title: 'Replacement Delivered',
      description: 'Quality lead verified delivery. Awaiting your resolution confirmation.',
      senderType: 'agent',
      senderName: 'Rahul Verma',
      tag: 'Solution Provided',
    },
  ];

  await Promise.all(
    eventsToCreate.map((ev) =>
      setDoc(doc(db, 'complaints', ev.complaintId, 'events', ev.id), {
        userId: uid,
        title: ev.title,
        description: ev.description,
        senderType: ev.senderType,
        senderName: ev.senderName,
        tag: ev.tag,
        createdAt: serverTimestamp(),
      })
    )
  );

  // Seed 4 Promise Tracker SLA items
  const promises = [
    {
      id: `prm_1_${uid.slice(0, 6)}`,
      complaintId: secondId,
      ticketCode: '#CMP-0199',
      title: 'Refund Credited',
      dueDateIso: hoursFromNow(52),
      progressPercent: 62,
      status: 'Active',
    },
    {
      id: `prm_2_${uid.slice(0, 6)}`,
      complaintId: primaryId,
      ticketCode: '#CMP-0187',
      title: 'Replacement Dispatch',
      dueDateIso: hoursFromNow(48),
      progressPercent: 54,
      status: 'Active',
    },
    {
      id: `prm_3_${uid.slice(0, 6)}`,
      complaintId: awaitingId,
      ticketCode: '#CMP-0162',
      title: 'Callback Scheduled',
      dueDateIso: hoursFromNow(16),
      progressPercent: 78,
      status: 'Active',
    },
    {
      id: `prm_4_${uid.slice(0, 6)}`,
      complaintId: starterComplaints[4].id,
      ticketCode: '#CMP-0153',
      title: 'Resolution Confirmation',
      dueDateIso: hoursFromNow(82),
      progressPercent: 100,
      status: 'Kept',
    },
  ];

  await Promise.all(
    promises.map((p) =>
      setDoc(doc(db, 'promises', p.id), {
        userId: uid,
        complaintId: p.complaintId,
        ticketCode: p.ticketCode,
        title: p.title,
        dueDateIso: p.dueDateIso,
        progressPercent: p.progressPercent,
        status: p.status,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
    )
  );

  // Seed 6 Notifications
  const notifications = [
    {
      id: `ntf_1_${uid.slice(0, 6)}`,
      complaintId: primaryId,
      ticketCode: '#CMP-0187',
      type: 'Agent Reply',
      title: 'Agent Reply',
      message: 'Rahul Verma has replied to your message for #CMP-0187',
      previewText: 'Hello, I have raised a priority transit trace and replacement request...',
      progressPercent: 0,
      isRead: false,
      unreadCount: 3,
    },
    {
      id: `ntf_2_${uid.slice(0, 6)}`,
      complaintId: primaryId,
      ticketCode: '#CMP-0187',
      type: 'AI Analysis',
      title: 'AI Analysis',
      message: 'Your complaint for a broken laptop is classified High Priority #CMP-0187',
      previewText: '',
      progressPercent: 0,
      isRead: false,
      unreadCount: 1,
    },
    {
      id: `ntf_3_${uid.slice(0, 6)}`,
      complaintId: secondId,
      ticketCode: '#CMP-0199',
      type: 'Promise Met',
      title: 'Promise Met',
      message: 'Refund trace reference number issued for #CMP-0199',
      previewText: '',
      progressPercent: 100,
      isRead: false,
      unreadCount: 2,
    },
    {
      id: `ntf_4_${uid.slice(0, 6)}`,
      complaintId: starterComplaints[4].id,
      ticketCode: '#CMP-0153',
      type: 'Promise Met',
      title: 'Promise Met',
      message: 'Wallet refund settlement confirmed for #CMP-0153',
      previewText: '',
      progressPercent: 100,
      isRead: true,
      unreadCount: 0,
    },
    {
      id: `ntf_5_${uid.slice(0, 6)}`,
      complaintId: awaitingId,
      ticketCode: '#CMP-0162',
      type: 'Progress Update',
      title: 'Progress Update',
      message: 'Progress on #CMP-0162 is now 75% complete',
      previewText: '',
      progressPercent: 75,
      isRead: false,
      unreadCount: 1,
    },
    {
      id: `ntf_6_${uid.slice(0, 6)}`,
      complaintId: awaitingId,
      ticketCode: '#CMP-0162',
      type: 'Resolution Confirm',
      title: 'Resolution Confirm',
      message: 'Is your broken headphones issue resolved? Click to confirm.',
      previewText: '',
      progressPercent: 100,
      isRead: false,
      unreadCount: 1,
    },
  ];

  await Promise.all(
    notifications.map((n) =>
      setDoc(doc(db, 'notifications', n.id), {
        userId: uid,
        complaintId: n.complaintId,
        ticketCode: n.ticketCode,
        type: n.type,
        title: n.title,
        message: n.message,
        previewText: n.previewText,
        progressPercent: n.progressPercent,
        isRead: n.isRead,
        unreadCount: n.unreadCount,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
    )
  );
}

export function subscribeUserProfile(
  uid: string,
  onData: (profile: UserProfile | null) => void
): Unsubscribe {
  const path = `users/${uid}`;
  return onSnapshot(
    doc(db, 'users', uid),
    (snap) => {
      if (!snap.exists()) {
        onData(null);
        return;
      }
      onData(snap.data() as UserProfile);
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    }
  );
}

export function subscribeComplaints(
  uid: string,
  onData: (items: Complaint[]) => void
): Unsubscribe {
  const path = 'complaints';
  const q = query(collection(db, 'complaints'), where('userId', '==', uid));
  return onSnapshot(
    q,
    (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Complaint));
      list.sort((a, b) => {
        const ta = a.updatedAt?.toMillis?.() ?? 0;
        const tb = b.updatedAt?.toMillis?.() ?? 0;
        return tb - ta;
      });
      onData(list);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export function subscribePromises(
  uid: string,
  onData: (items: PromiseItem[]) => void
): Unsubscribe {
  const path = 'promises';
  const q = query(collection(db, 'promises'), where('userId', '==', uid));
  return onSnapshot(
    q,
    (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as PromiseItem));
      list.sort((a, b) => a.dueDateIso.localeCompare(b.dueDateIso));
      onData(list);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export function subscribeNotifications(
  uid: string,
  onData: (items: NotificationItem[]) => void
): Unsubscribe {
  const path = 'notifications';
  const q = query(collection(db, 'notifications'), where('userId', '==', uid));
  return onSnapshot(
    q,
    (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as NotificationItem));
      list.sort((a, b) => {
        if (a.isRead !== b.isRead) return a.isRead ? 1 : -1;
        const ta = a.createdAt?.toMillis?.() ?? 0;
        const tb = b.createdAt?.toMillis?.() ?? 0;
        return tb - ta;
      });
      onData(list);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export function subscribeComplaintEvents(
  complaintId: string,
  uid: string,
  onData: (events: ComplaintEvent[]) => void
): Unsubscribe {
  const path = `complaints/${complaintId}/events`;
  const q = query(collection(db, 'complaints', complaintId, 'events'), where('userId', '==', uid));
  return onSnapshot(
    q,
    (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as ComplaintEvent));
      list.sort((a, b) => {
        const ta = a.createdAt?.toMillis?.() ?? 0;
        const tb = b.createdAt?.toMillis?.() ?? 0;
        return ta - tb;
      });
      onData(list);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export async function createComplaint(params: {
  uid: string;
  customerName: string;
  category: string;
  orderId: string;
  title: string;
  description: string;
  priority: ComplaintPriority;
  attachments: string[];
  isDraft: boolean;
  aiClassification: string;
  aiClarityScore: number;
  aiSuggestion: string;
  estimatedResolution: string;
  assignedTeam: string;
}): Promise<string> {
  const complaintId = makeId('cmp');
  const ticketNum = Math.floor(215 + Math.random() * 780);
  const ticketCode = `#CMP-0${ticketNum}`;
  const status: ComplaintStatus = params.isDraft ? 'Draft' : 'In Progress';
  const currentStep = params.isDraft ? 1 : 3;
  const path = `complaints/${complaintId}`;

  try {
    await setDoc(doc(db, 'complaints', complaintId), {
      userId: params.uid,
      ticketCode,
      title: safeStr(params.title, 160, 'Untitled Complaint'),
      category: safeStr(params.category, 80, 'General'),
      orderId: safeStr(params.orderId, 64, ''),
      description: safeStr(params.description, 2000, 'No description provided.'),
      priority: params.priority,
      status,
      currentStep,
      assignedAgentName: params.isDraft ? 'Pending Assignment' : 'Rahul Verma',
      assignedAgentRole: 'Support Billing Specialist',
      assignedAgentRating: 4.9,
      aiClassification: safeStr(params.aiClassification, 120, `${params.category} > Triage`),
      aiClarityScore: Math.min(100, Math.max(0, Math.round(params.aiClarityScore || 82))),
      aiSuggestion: safeStr(params.aiSuggestion, 500, 'Details logged for priority specialist review.'),
      estimatedResolution: safeStr(params.estimatedResolution, 80, '2-4 working days'),
      assignedTeam: safeStr(params.assignedTeam, 100, 'Customer Resolution Team'),
      attachments: safeList(params.attachments, 10, 120),
      latestUpdateNote: params.isDraft
        ? 'Saved as draft. Review and submit when ready.'
        : `Assigned to ${safeStr(params.assignedTeam, 80, 'Support Team')} for investigation.`,
      resolutionSummary: ['Initial review logged', 'Evidence attachments verified'],
      rating: 0,
      feedbackText: '',
      resolvedInDays: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    if (!params.isDraft) {
      const eventId = makeId('evt');
      const promiseId = makeId('prm');
      const notifId = makeId('ntf');
      const dueDateIso = new Date(Date.now() + 72 * 3600 * 1000).toISOString();

      await Promise.all([
        setDoc(doc(db, 'complaints', complaintId, 'events', eventId), {
          userId: params.uid,
          title: 'Complaint submitted',
          description: 'Your complaint was received and analyzed by ResolveLoop AI.',
          senderType: 'customer',
          senderName: safeStr(params.customerName, 100, 'Customer'),
          tag: safeStr(params.aiClassification, 80, params.category),
          createdAt: serverTimestamp(),
        }),
        setDoc(doc(db, 'promises', promiseId), {
          userId: params.uid,
          complaintId,
          ticketCode,
          title: safeStr(params.title, 160, 'Resolution Promise'),
          dueDateIso,
          progressPercent: 35,
          status: 'Active',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        }),
        setDoc(doc(db, 'notifications', notifId), {
          userId: params.uid,
          complaintId,
          ticketCode,
          type: 'AI Analysis',
          title: 'AI Analysis',
          message: `Complaint ${ticketCode} classified as ${safeStr(params.aiClassification, 80)} (${params.priority} Priority).`,
          previewText: safeStr(params.aiSuggestion, 300),
          progressPercent: 35,
          isRead: false,
          unreadCount: 1,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        }),
      ]);
    }

    return complaintId;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateDraftAndSubmit(
  complaint: Complaint,
  updates: {
    title: string;
    category: string;
    orderId: string;
    description: string;
    priority: ComplaintPriority;
    attachments: string[];
    aiClassification: string;
    aiClarityScore: number;
    aiSuggestion: string;
    estimatedResolution: string;
    assignedTeam: string;
    submitNow: boolean;
  },
  customerName: string
): Promise<void> {
  const path = `complaints/${complaint.id}`;
  try {
    await updateDoc(doc(db, 'complaints', complaint.id), {
      title: safeStr(updates.title, 160, complaint.title),
      category: safeStr(updates.category, 80, complaint.category),
      orderId: safeStr(updates.orderId, 64, ''),
      description: safeStr(updates.description, 2000, complaint.description),
      priority: updates.priority,
      status: updates.submitNow ? 'In Progress' : 'Draft',
      currentStep: updates.submitNow ? 3 : 1,
      aiClassification: safeStr(updates.aiClassification, 120, complaint.aiClassification),
      aiClarityScore: Math.min(100, Math.max(0, Math.round(updates.aiClarityScore))),
      aiSuggestion: safeStr(updates.aiSuggestion, 500, complaint.aiSuggestion),
      estimatedResolution: safeStr(updates.estimatedResolution, 80, complaint.estimatedResolution),
      assignedTeam: safeStr(updates.assignedTeam, 100, complaint.assignedTeam),
      attachments: safeList(updates.attachments, 10, 120),
      latestUpdateNote: updates.submitNow
        ? `Submitted and routed to ${safeStr(updates.assignedTeam, 80)}.`
        : 'Draft updated.',
      updatedAt: serverTimestamp(),
    });

    if (updates.submitNow) {
      await setDoc(doc(db, 'complaints', complaint.id, 'events', makeId('evt')), {
        userId: complaint.userId,
        title: 'Complaint submitted',
        description: 'Draft finalized and submitted to specialist queue.',
        senderType: 'customer',
        senderName: safeStr(customerName, 100, 'Customer'),
        tag: safeStr(updates.aiClassification, 80, updates.category),
        createdAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteDraftComplaint(complaintId: string): Promise<void> {
  const path = `complaints/${complaintId}`;
  try {
    await deleteDoc(doc(db, 'complaints', complaintId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function escalateComplaint(complaint: Complaint): Promise<void> {
  const path = `complaints/${complaint.id}`;
  try {
    await updateDoc(doc(db, 'complaints', complaint.id), {
      priority: 'Critical',
      status: 'Escalated',
      currentStep: Math.max(complaint.currentStep, 4),
      latestUpdateNote: 'Issue escalated to senior quality lead for immediate resolution.',
      updatedAt: serverTimestamp(),
    });

    await setDoc(doc(db, 'complaints', complaint.id, 'events', makeId('evt')), {
      userId: complaint.userId,
      title: 'Issue Escalated',
      description: 'Customer requested priority escalation. Quality lead notified.',
      senderType: 'system',
      senderName: 'ResolveLoop SLA Monitor',
      tag: 'Escalated',
      createdAt: serverTimestamp(),
    });

    await setDoc(doc(db, 'notifications', makeId('ntf')), {
      userId: complaint.userId,
      complaintId: complaint.id,
      ticketCode: complaint.ticketCode,
      type: 'Progress Update',
      title: 'Priority Escalated',
      message: `${complaint.ticketCode} has been escalated to Critical priority.`,
      previewText: 'Senior resolution specialist notified.',
      progressPercent: 75,
      isRead: false,
      unreadCount: 1,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function confirmOrReopenComplaint(params: {
  complaint: Complaint;
  resolved: boolean;
  rating: number;
  feedbackText: string;
}): Promise<void> {
  const path = `complaints/${params.complaint.id}`;
  try {
    await updateDoc(doc(db, 'complaints', params.complaint.id), {
      status: params.resolved ? 'Resolved' : 'Escalated',
      currentStep: params.resolved ? 6 : 4,
      rating: Math.min(5, Math.max(0, Math.round(params.rating))),
      feedbackText: safeStr(params.feedbackText, 1000, ''),
      latestUpdateNote: params.resolved
        ? 'Resolution confirmed by customer and ticket closed.'
        : 'Reopened by customer — escalated for follow-up.',
      updatedAt: serverTimestamp(),
    });

    await setDoc(doc(db, 'complaints', params.complaint.id, 'events', makeId('evt')), {
      userId: params.complaint.userId,
      title: params.resolved ? 'Resolution Confirmed' : 'Complaint Reopened',
      description: params.resolved
        ? `Customer confirmed resolution (${params.rating}/5 stars).`
        : 'Customer marked issue as still unresolved and escalated.',
      senderType: 'customer',
      senderName: 'Customer Confirmation',
      tag: params.resolved ? 'Closed' : 'Reopened',
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function addComplaintMessage(params: {
  complaint: Complaint;
  senderType: 'customer' | 'agent';
  senderName: string;
  message: string;
}): Promise<void> {
  const eventId = makeId('evt');
  const path = `complaints/${params.complaint.id}/events/${eventId}`;
  try {
    await setDoc(doc(db, 'complaints', params.complaint.id, 'events', eventId), {
      userId: params.complaint.userId,
      title: params.senderType === 'customer' ? 'Customer Message' : `${params.senderName} Replied`,
      description: safeStr(params.message, 500),
      senderType: params.senderType,
      senderName: safeStr(params.senderName, 100),
      tag: 'Chat',
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function markNotificationRead(notificationId: string): Promise<void> {
  const path = `notifications/${notificationId}`;
  try {
    await updateDoc(doc(db, 'notifications', notificationId), {
      isRead: true,
      unreadCount: 0,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function markPromiseKept(promiseId: string): Promise<void> {
  const path = `promises/${promiseId}`;
  try {
    await updateDoc(doc(db, 'promises', promiseId), {
      progressPercent: 100,
      status: 'Kept',
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function updateUserProfileDetails(
  uid: string,
  details: {
    fullName: string;
    email: string;
    mobileNumber: string;
    dateOfBirth: string;
    occupation: string;
    location: string;
  }
): Promise<void> {
  const path = `users/${uid}`;
  try {
    await updateDoc(doc(db, 'users', uid), {
      fullName: safeStr(details.fullName, 120, 'User'),
      email: safeStr(details.email, 180),
      mobileNumber: safeStr(details.mobileNumber, 32),
      dateOfBirth: safeStr(details.dateOfBirth, 20),
      occupation: safeStr(details.occupation, 100),
      location: safeStr(details.location, 100),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function updateNotificationSettings(
  uid: string,
  prefs: {
    notifyEmail: boolean;
    notifySms: boolean;
    notifyPromise: boolean;
    notifyCommunity: boolean;
  }
): Promise<void> {
  const path = `users/${uid}`;
  try {
    await updateDoc(doc(db, 'users', uid), {
      notifyEmail: prefs.notifyEmail,
      notifySms: prefs.notifySms,
      notifyPromise: prefs.notifyPromise,
      notifyCommunity: prefs.notifyCommunity,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}
