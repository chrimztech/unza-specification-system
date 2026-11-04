import sys
from reportlab.graphics.shapes import Drawing, String, Rect, Line, Circle
from reportlab.lib import colors
from docgen import (Doc, pipeline, figure, box, arrow, CONTENT_W, GREEN, GREEN_DARK, GREEN_TINT, GOLD,
                    GOLD_TINT, BLUE, BLUE_TINT, RED, RED_TINT, MUTED, RULE, INK)

OUT, LOGO = sys.argv[1], sys.argv[2]
d = Doc(OUT, "User Manual", "Equipment Specification & Request Management System",
        "User Manual", "1.2", "4 November 2026", "All University of Zambia staff who use the system", LOGO)

d.toc_page()

# ------------------------------------------------------------------ about
d.h1("About this manual", numbered=False)
d.lead("This manual explains, step by step, how to use the CICT Equipment Specification & Request Management "
       "System to ask for ICT equipment, approve requests, and carry them through to delivery.")
d.h3("Who should read what")
d.p("Everyone should read **Chapters 1 to 4**. After that, read the chapters for the work you do. Your "
    "role decides which menu items you see; Chapter 2 explains the roles.")
d.table(["If you…", "Read"], [
    ("need equipment for yourself, your office or your students", "Chapters 1–6 (Getting started, Making a request, Tracking your requests)"),
    ("approve requests as a head of unit or manager", "Chapter 7 (Managers)"),
    ("work in CICT and review specifications", "Chapter 8 (CICT reviewers)"),
    ("work in Procurement", "Chapter 9 (Procurement)"),
    ("work in Stores", "Chapter 10 (Stores)"),
    ("work in CICT Support and install equipment", "Chapter 11 (CICT Support)"),
    ("monitor or audit the process", "Chapter 12 (Reports, directory and audit)"),
    ("administer the system", "Chapter 13 (Administrators)"),
], [0.5, 0.5])
d.h3("Symbols used in this manual")
d.callout("tip", "A tip saves you time or helps you avoid a common mistake.")
d.callout("info", "Good-to-know boxes explain why the system works the way it does.")
d.callout("warning", "Important boxes warn about actions that cannot be undone or that have consequences for others.")
d.p("Names of buttons, menu items and fields are shown in **bold**, for example: click **Submit for approval**.")

# ------------------------------------------------------------------ 1 introduction
d.h1("Introduction")
d.lead("The system is the University's single route for acquiring ICT equipment such as laptops, desktops, "
       "printers, projectors, network equipment and software licences.")
d.h2("What the system does")
d.p("When you need ICT equipment, you describe what you need and why. Your manager confirms that the need is "
    "genuine. CICT then sets the technical specification, making sure that what is bought meets University "
    "standards, is supportable and offers value for money. Procurement buys it, Stores receives it, and CICT "
    "Support installs and checks it. You can see where your request is at every step.")
d.h2("The journey of a request")
figure(d, pipeline([
    ("1. You request", "describe the need\nand the items"),
    ("2. Manager", "confirms the\nbusiness need"),
    ("3. CICT", "sets the technical\nspecification"),
    ("4. Procurement", "gets quotations\nand buys"),
    ("5. Stores", "receives the\ngoods"),
    ("6. CICT Support", "installs and\nverifies"),
    ("7. Completed", "equipment\nin service"),
], height=66), "Figure 1 — Every request follows the same route. You are notified at each important step.")
d.h2("Benefits for you")
d.bullets([
    "**One place** to ask for equipment, instead of letters and emails.",
    "**Clear progress.** You always know whose desk your request is on.",
    "**Fair, consistent specifications** based on the work you do, not on who you ask.",
    "**Official documents** (specification sheet, purchase order, stores receipt, verification certificate) produced automatically.",
    "**A permanent record** of every decision and who made it.",
])
d.h2("Service standards")
d.p("CICT and managers aim to meet these turnaround times (set by CICT and shown in the system):")
d.table(["Step", "Target"], [
    ("Manager authorisation", "3 working days"),
    ("CICT technical review", "5 working days"),
    ("Urgent requests", "Reviewed within 1 working day where justified"),
    ("Your reply to a clarification question", "Within 5 working days"),
], [0.55, 0.45])
d.callout("info", "CICT approval confirms the **technical specification**. It is not authority to spend. Sourcing, "
          "pricing and supplier selection remain with Procurement under University procurement rules.")

# ------------------------------------------------------------------ 2 getting started
d.h1("Getting started")
d.h2("What you need")
d.bullets([
    "A computer, tablet or phone with a modern web browser (Chrome, Edge, Firefox or Safari).",
    "Your **UNZA HR staff credentials** — the same username (staff number or institutional email) and password you use for HR services.",
    "An active staff record in the HR system.",
])
d.h2("Signing in")
d.steps([
    "Open the system's web address in your browser. The welcome page explains the service.",
    "Click **Staff sign in**.",
    "In the first box enter your **staff number or institutional email**, for example `123456` or `name@unza.zm`.",
    "Enter your HR **password**. Click the eye icon if you want to check what you typed.",
    "Click **Sign in**. Your **Dashboard** opens.",
])
d.callout("info", "There is no separate registration. The first time you sign in, the system creates your account "
          "from your HR record and gives you the **Requester** role, so you can start making requests immediately.")
d.h3("If you cannot sign in")
d.table(["Message", "What it means and what to do"], [
    ("Those staff credentials were not accepted by the HR system.", "The username or password is wrong. Check them, or reset your password through HR."),
    ("Your staff account is not active. Please contact HR.", "HR shows your record as inactive. Only HR can fix this."),
    ("Too many sign-in attempts…", "After 5 wrong passwords your sign-in is paused for 15 minutes. Wait, then try again carefully."),
    ("The HR system could not be reached…", "The HR service is temporarily unavailable. Try again shortly; if it continues, contact the CICT service desk."),
    ("Could not reach the server.", "Your connection or the system is down. Check your internet connection and try again."),
], [0.42, 0.58])
d.h2("Finding your way around")


def screen_map():
    W, H = CONTENT_W, 250
    dr = Drawing(W, H)
    dr.add(Rect(0, 0, W, H, fillColor=colors.white, strokeColor=RULE, strokeWidth=1))
    sw = 120
    dr.add(Rect(0, 0, sw, H, fillColor=GREEN_TINT, strokeColor=RULE, strokeWidth=0.6))
    dr.add(Rect(sw, H - 30, W - sw, 30, fillColor=colors.HexColor("#F7F9F8"), strokeColor=RULE, strokeWidth=0.6))

    def t(x, y, s, size=7.6, font="Body", color=INK, anchor="start"):
        dr.add(String(x, y, s, fontName=font, fontSize=size, fillColor=color, textAnchor=anchor))

    t(10, H - 20, "UNZA · CICT", 8.5, "Body-Bold", GREEN_DARK)
    dr.add(Rect(10, H - 46, sw - 20, 16, rx=4, ry=4, fillColor=GREEN, strokeColor=GREEN))
    t(sw / 2, H - 41, "+ New request", 7.6, "Body-Bold", colors.white, "middle")
    y = H - 66
    for group, items in (("WORKSPACE", ["Dashboard", "Requests", "Catalogue"]),
                         ("MY WORK", ["Manager approvals", "CICT reviews", "Procurement …"]),
                         ("OVERSIGHT", ["Reports", "Directory", "Administration"])):
        t(12, y, group, 6.4, "Body-Bold", MUTED)
        y -= 12
        for it in items:
            t(18, y, it, 7.6)
            y -= 11
        y -= 6
    t(12, 28, "Your name & role", 7.6, "Body-Semi")
    t(12, 16, "Help  ·  Sign out", 7, color=MUTED)
    # top bar
    t(sw + 12, H - 19, "Page title", 8, "Body-Semi")
    dr.add(Circle(W - 46, H - 15, 7, fillColor=colors.white, strokeColor=MUTED, strokeWidth=0.8))
    dr.add(Circle(W - 40, H - 10, 3.5, fillColor=RED, strokeColor=RED))
    dr.add(Circle(W - 20, H - 15, 8, fillColor=GREEN, strokeColor=GREEN))
    # main area
    dr.add(Rect(sw + 14, 20, W - sw - 28, H - 66, fillColor=colors.white, strokeColor=RULE, strokeWidth=0.6,
                strokeDashArray=[3, 3]))
    t(sw + (W - sw) / 2, H / 2 - 10, "Main working area", 9, "Body-Semi", MUTED, "middle")
    # callouts
    def call(n, x, y):
        dr.add(Circle(x, y, 7, fillColor=GOLD, strokeColor=GOLD))
        t(x, y - 2.6, str(n), 7.4, "Body-Bold", colors.white, "middle")
    call(1, sw - 4, H - 38)
    call(2, sw - 4, H - 110)
    call(3, sw - 4, 30)
    call(4, W - 62, H - 15)
    call(5, W - 6, H - 30)
    call(6, W - 30, H / 2)
    return dr


figure(d, screen_map(), "Figure 2 — The main screen layout after signing in.")
d.table(["", "Area", "What it does"], [
    ("1", "**New request** button", "Starts a new equipment request from anywhere in the system."),
    ("2", "Menu (sidebar)", "Links grouped into **Workspace** (everyone), **My work** (queues for your roles) and **Oversight** (monitoring and administration). You only see the items your roles allow."),
    ("3", "Your profile, Help and Sign out", "Click your name to open your profile. **Help** opens guidance and policy. The door icon signs you out."),
    ("4", "Notifications bell", "A red badge shows how many unread notices you have. Click to open your notifications."),
    ("5", "Profile shortcut", "Your initials; opens your profile."),
    ("6", "Main working area", "The page you are on."),
], [0.05, 0.27, 0.68])
d.p("On a phone or small tablet the menu is hidden. Tap the **menu icon** at the top left to open it, and the "
    "**X** to close it.")
d.h2("Signing out")
d.p("Click the **sign-out icon** next to your name at the bottom of the menu. For security you are also signed "
    "out automatically after 8 hours, or if your access is changed by an administrator. Always sign out on a "
    "shared computer.")

# ------------------------------------------------------------------ 3 roles
d.h1("Roles and what you can see")
d.lead("Everyone starts as a Requester. CICT administrators give additional roles to the people who approve, "
       "review, buy, store, install or audit equipment. One person can hold several roles.")
d.table(["Role", "Who typically holds it", "What it lets you do", "Menu items added"], [
    ("Requester", "All staff", "Make, track, withdraw and answer questions about your own requests.", "Dashboard, Requests, Catalogue"),
    ("Manager", "Heads of department, deans, directors", "Approve, return or reject requests where you are the chosen approving manager; delegate this authority.", "Manager approvals"),
    ("CICT reviewer / CICT manager", "CICT technical staff", "Set and approve the technical specification; ask for clarification; maintain specification profiles.", "CICT reviews, Standards, Reports, Directory"),
    ("Procurement", "Procurement unit staff", "Record quotations, evaluate them, record purchases, restart procurement after a return.", "Procurement, Reports, Directory"),
    ("Stores", "Stores staff", "Record that purchased goods have been received.", "Stores, Reports, Directory"),
    ("CICT Support", "CICT support technicians", "Verify that delivered equipment is installed and working.", "Verification, Reports, Directory"),
    ("Auditor", "Internal audit", "Read-only view of all requests, reports and the audit trail.", "Reports, Directory, Audit log"),
    ("Administrator", "Designated CICT administrators", "Everything above, plus managing roles, units, catalogue, lists and settings.", "All of the above and Administration"),
], [0.17, 0.2, 0.4, 0.23], font_size=8.4)
d.callout("info", "Being given the Manager role shows you the approvals queue, but you can only approve a request when "
          "the requester has **chosen you** as their approving manager (or when that manager has delegated "
          "authority to you).")
d.p("If you need a role you do not have, ask a CICT administrator. The change applies straight away; you may "
    "need to refresh the page to see new menu items.")

# ------------------------------------------------------------------ 4 dashboard
d.h1("Your dashboard and notifications")
d.h2("The dashboard")
d.p("The dashboard is the first page you see after signing in. It summarises what needs your attention:")
d.table(["Panel", "What it shows"], [
    ("**My requests**", "How many requests you have raised."),
    ("**Awaiting my approval**", "Requests waiting for your decision as approving manager (or delegate)."),
    ("**In technical review**", "Requests currently with CICT."),
    ("**Approved**", "Requests whose specification CICT has approved."),
    ("**Awaiting your approval**", "A list of requests you need to decide on, with a link to each."),
    ("**Recent requests**", "Your most recent requests and their current status."),
], [0.3, 0.7])
d.p("Click any request reference or title to open it. The **Open request** button starts a new request.")
d.h2("Notifications")
d.p("The system sends you a notice whenever a request reaches a step where you are involved:")
d.bullets([
    "**As a requester**, when your request is approved, rejected, returned for correction, needs clarification, is purchased, arrives in stores or is completed.",
    "**As a manager**, when a request naming you as approving manager is submitted (also sent to anyone you have delegated to).",
    "**As CICT**, when a request is ready for technical review or a requester answers a clarification question.",
])
d.p("You are never notified about something you did yourself. To read your notices, click the **bell** or open "
    "**Notifications**:")
d.bullets([
    "Unread notices are highlighted. Click **Open request** to go straight to the request (this also marks it read).",
    "Click **Mark read** for one notice, or **Mark all read** at the top.",
    "Click the **X** to dismiss a notice you no longer need.",
])
d.callout("note", "Notices are shown inside the system. If CICT has switched on email, a copy is also sent to your "
          "institutional email address.")

# ------------------------------------------------------------------ 5 making a request
d.h1("Making an equipment request")
d.lead("A request has four short steps. You can save a draft at any time and come back to it later.")
figure(d, pipeline([
    ("1. Business need", "what the work\nrequires and why"),
    ("2. Equipment items", "each item, its use\nand its users"),
    ("3. Funding & timing", "priority, budget\nand deadlines"),
    ("4. Review & submit", "check, choose manager,\naccept declaration"),
], height=62), "Figure 3 — The four steps of the request form. A progress bar shows where you are.")
d.p("Use **Continue** to move to the next step and **Back** to return to the previous one. You can also click a "
    "completed step at the top of the form to jump back to it.")
d.h2("Before you start")
d.bullets([
    "Know **why** the equipment is needed and what happens if it is not provided. Requests without a clear operational or academic reason are returned.",
    "Know **who will use it**, where it will be kept, and any software it must run.",
    "For a **replacement**, have the old equipment's asset tag and details to hand.",
    "Know **who your approving manager is** — normally your head of department or unit.",
    "Look at the **Catalogue** (menu: Workspace → Catalogue) to see the equipment categories and the standard specifications CICT offers.",
])
d.h2("Step 1 — Business need")
d.p("Click **New request**. Complete the first step:")
d.table(["Field", "What to enter", "Required"], [
    ("**Request title**", "A short, descriptive name, for example \"Laptops for new Biology lecturers\".", "Yes"),
    ("**Unit / School**", "The school, directorate or unit making the request.", "Yes"),
    ("**Department**", "The department within that unit.", "Yes"),
    ("**Designation of intended user**", "The position of the person who will use the equipment (for example Lecturer, Dean). Choose **Other (please specify)** if it is not listed. This helps CICT recommend the right specification.", "Yes"),
    ("**Request type**", "New requirement, Replacement, Upgrade, Expansion, Shared resource, Project requirement or Temporary need.", "Yes"),
    ("**Business context**", "Administration, Teaching, Research, Laboratory, Student service or Grant / project.", "Yes"),
    ("**Business justification**", "Why the equipment is needed. Be specific: what work it supports and how many people benefit. At least 10 characters.", "Yes"),
    ("**Impact if not provided**", "What happens if the request is refused or delayed.", "Recommended"),
    ("**Requested on behalf of**", "Leave as yourself, choose a colleague registered in the system, or choose *Other* and type a name, if you are requesting for someone else.", "Optional"),
    ("**Existing asset tag, Existing equipment details, Reason for replacement**", "Shown when the request type is Replacement. Identify the old equipment and explain why it must be replaced (age, fault, cost of repair).", "For replacements"),
], [0.27, 0.58, 0.15], font_size=8.6)
d.callout("tip", "A strong justification is the single biggest factor in a quick approval. Name the course, project or "
          "service the equipment supports and the number of staff or students affected.")
d.h2("Step 2 — Equipment items")
d.p("Add one item for each type of equipment. Click **Add item** for more. For each item:")
d.table(["Field", "What to enter"], [
    ("**Equipment category**", "Choose from the catalogue, for example Laptop, Printer or Software Licence."),
    ("**Quantity**", "How many units (1 or more)."),
    ("**What will it be used for?**", "The purpose of this particular item."),
    ("**Number of users**", "For printers and shared equipment: how many people will use it. This is **required for printers**. More users can mean a higher specification is recommended."),
    ("**Intended users**", "Who will use it, if not a single person (for example \"Postgraduate lab students\")."),
    ("**Location / office**", "Where the equipment will be installed."),
    ("**Designation of this item's user**", "Optional. Use it when one item is for a different person from the rest of the request, for example one laptop for the Dean among otherwise general equipment."),
    ("**Software or systems it must run**", "Any software the equipment must support, for example statistical or design packages."),
    ("**Software category**", "For software licences: Design, Teaching, Development or Other. **Required for software.**"),
    ("**Proposed specification**", "Optional. Describe any specific requirements. CICT will consider them during review."),
], [0.3, 0.7], font_size=8.6)
d.h3("The recommended specification")
d.p("As you fill in an item, the system shows the **recommended specification tier** — Standard, Enhanced or "
    "Specialised — and the matching CICT profile. The recommendation is based on:")
d.bullets([
    "the equipment category;",
    "the position level of the intended user (the more demanding the role, the higher the profile that suits it);",
    "for shared equipment, the number of users: more than 5 users needs at least *Enhanced*, more than 15 needs *Specialised*.",
])
d.p("You do not have to choose a specification yourself. CICT confirms the final specification during review.")
d.h2("Step 3 — Funding and timing")
d.table(["Field", "What to enter"], [
    ("**Priority**", "Normal, High or Urgent."),
    ("**Reason for elevated priority**", "Required if you choose High or Urgent. Explain the deadline or risk."),
    ("**Required by**", "The date you need the equipment in service."),
    ("**Budget status**", "Budgeted for current year, Not yet budgeted, Funded by project or grant, or Unknown."),
    ("**Funding source**", "For example the departmental budget or a named grant."),
    ("**Cost centre**", "The cost centre to be charged, if known."),
], [0.3, 0.7])
d.p("The system shows an **indicative value** calculated from CICT's published indicative unit costs. This is a "
    "guide for budgeting only — it is not a quotation. Procurement confirms actual prices.")
d.h2("Step 4 — Review and submit")
d.steps([
    "Check the summary of everything you entered. Use **Back** to correct anything.",
    "Choose your **Approving manager**. The request goes to this person first, then to CICT.",
    "Read the **declaration** and tick the box to accept it. You confirm that the information is accurate, the equipment is for authorised University use, and the request is not a duplicate.",
    "Click **Submit for approval**.",
])
d.p("The request receives a reference number in the form `YYYYMMDDnnnn` (for example `202610130001`: the date "
    "plus a daily sequence). Quote this reference whenever you contact CICT about the request.")
d.h3("If the system will not let you submit")
d.p("The system checks that everything needed has been filled in. The message tells you exactly what is "
    "missing, for example:")
d.bullets([
    "\"Give a business justification.\" — the justification is missing or too short.",
    "\"Specify the number of users for item 2.\" — item 2 is a printer without a number of users.",
    "\"Select a valid software category for item 1.\" — a software item needs its category.",
    "\"Choose the approving manager.\" or \"Accept the requester declaration before submitting.\"",
])
d.h2("Saving and finishing drafts")
d.bullets([
    "Click **Save draft** at any step (a title is needed first). Nothing is sent to anyone while a request is a draft.",
    "To continue, open **Requests**, open the draft, and click **Complete & submit**.",
    "To discard a draft, open it and click **Delete draft**. Only drafts can be deleted, and only by the person who created them.",
])
d.h2("Attaching supporting documents")
d.p("On the request page you can upload supporting documents such as quotations you already hold, photos of "
    "faulty equipment or a project approval letter.")
d.bullets([
    "Accepted file types: PDF, Word, Excel, PowerPoint, text, CSV, and images (JPG, PNG, GIF, WEBP, HEIC).",
    "Maximum size: 25 MB per file.",
    "Anyone who can see the request can download its attachments. You can delete files you uploaded.",
])

# ------------------------------------------------------------------ 6 tracking
d.h1("Tracking your requests")
d.h2("The Requests list")
d.p("Open **Requests** in the menu to see every request you are allowed to see.")
d.bullets([
    "**Search** by reference, title or unit.",
    "**Filter by status**, or by *Everything I can see*, *Raised by me* or *Where I am the manager*.",
    "Click **Export CSV** to download the list for use in Excel.",
    "Click a reference or title to open the request.",
])
d.h2("What each status means")
d.table(["Status", "What it means", "Who acts next"], [
    ("**Draft**", "Not yet submitted, or returned to you for correction.", "You"),
    ("**Awaiting manager**", "Waiting for your approving manager.", "Manager"),
    ("**With CICT**", "Your manager approved; CICT is reviewing the specification.", "CICT"),
    ("**Clarification needed**", "CICT has asked you a question.", "You"),
    ("**CICT approved**", "The specification is approved; procurement can begin.", "Procurement"),
    ("**With procurement**", "Quotations are being gathered and evaluated.", "Procurement"),
    ("**Purchased**", "A purchase has been made.", "Stores"),
    ("**In stores**", "The goods have been received into stores.", "CICT Support"),
    ("**Completed**", "Installed and verified. The process is finished.", "—"),
    ("**Return required**", "The delivered equipment failed checks and must be returned to the supplier.", "Procurement"),
    ("**Rejected**", "Refused by your manager or CICT. The reason is shown in the audit trail.", "—"),
    ("**Withdrawn**", "You cancelled the request.", "—"),
], [0.22, 0.56, 0.22])
d.h2("The request page")
d.p("Opening a request shows everything about it:")
d.table(["Section", "Contents"], [
    ("Header", "Reference, title, current status and buttons for the documents available at this stage."),
    ("**Business case**", "The need, justification, type, context, funding and timing you entered."),
    ("**Equipment items**", "Each item with its recommended and, once reviewed, approved specification."),
    ("**Attachments**", "Supporting files: upload, download and delete."),
    ("**Procurement pipeline**", "After CICT approval: quotations, evaluation, purchase, receipt and verification progress."),
    ("**Actions**", "Buttons for whatever you are allowed to do at this stage (for example Withdraw, or Send response to CICT)."),
    ("**Audit trail**", "Every action taken on the request: who, when, what changed and any note or reason."),
], [0.25, 0.75])
d.h2("Answering a clarification question")
d.p("If CICT needs more information, the status changes to **Clarification needed** and you are notified.")
d.steps([
    "Open the request. CICT's question is shown in the audit trail.",
    "In **Actions**, type your answer in **Response to CICT**.",
    "Click **Send response to CICT**. The request goes back to CICT for review.",
])
d.callout("tip", "Reply within 5 working days. A clear, complete answer avoids a second round of questions.")
d.h2("When your request is returned for correction")
d.p("If your manager returns the request, it goes back to **Draft** with the manager's reason in the audit trail. "
    "Open it, click **Complete & submit**, make the corrections and submit again.")
d.h2("Withdrawing a request")
d.p("If you no longer need the equipment, open the request and click **Withdraw** in Actions. You can withdraw "
    "while it is a draft, awaiting your manager, with CICT or awaiting clarification. Once CICT has approved it, "
    "contact Procurement instead.")
d.callout("warning", "Withdrawing cannot be undone. To ask again later, make a new request.")
d.h2("Printable documents")
d.p("Each request produces official documents on University letterhead as it progresses. Open the request and "
    "click the document's button, then **Print / save as PDF**. In the print dialog choose *Save as PDF* as the "
    "destination to keep an electronic copy; A4 portrait is recommended. Each document shows page numbers and who "
    "generated it, and every print is recorded in the audit log.")
d.table(["Document", "Available once the request is…", "Used for"], [
    ("**Printable request form**", "Any status", "A paper copy of the request."),
    ("**Specification sheet**", "CICT approved (and after)", "The approved minimum specification, given to Procurement and suppliers."),
    ("**Purchase order**", "Purchased (and after)", "The purchase details: vendor, amount and PO number."),
    ("**Stores receipt**", "In stores (and after)", "Proof the goods were received, with their condition."),
    ("**Verification certificate**", "Completed or Return required", "CICT Support's confirmation that the equipment is installed and working (or why it failed)."),
], [0.27, 0.3, 0.43])

# ------------------------------------------------------------------ 7 managers
d.h1("Managers: approving requests")
d.lead("As approving manager you confirm that the business need is genuine and that the request fits your unit's "
       "priorities. CICT then deals with the technical side.")
d.h2("Your approval queue")
d.p("Open **Manager approvals** in the menu (or the *Awaiting your approval* panel on your dashboard). The queue "
    "lists every request waiting for you, with reference, title, unit, requester, submission date and status. "
    "Search by reference, title, unit or requester.")
d.h2("Making a decision")
d.steps([
    "Click **Review** (or the request title) to open the request.",
    "Read the business case, the items and any attachments.",
    "Type a **Decision note** if you wish to explain your decision.",
    "Choose one of the three decisions below.",
])
d.table(["Decision", "What happens", "Note needed?"], [
    ("**Approve business need**", "The request moves to CICT for technical review (**With CICT**). The requester can see your approval.", "Optional"),
    ("**Return for correction**", "The request goes back to the requester as a **Draft** to fix and resubmit. Use this when details are missing or wrong.", "**Yes** — say what to correct"),
    ("**Reject**", "The request is closed as **Rejected**. Use this when the need is not justified.", "**Yes** — give the reason"),
], [0.25, 0.5, 0.25])
d.callout("tip", "Prefer **Return for correction** over Reject when the need is genuine but the request is incomplete; "
          "it saves the requester starting again.")
d.h2("Delegating your authority")
d.p("When you are on leave or travelling, delegate your approvals so requests are not held up:")
d.steps([
    "Open your **profile** (click your name at the bottom of the menu).",
    "In **Delegation of authority**, choose the colleague under **Delegate to**.",
    "Optionally set the date the delegation ends, and a **reason** such as \"Annual leave\".",
    "Click **Delegate authority**.",
])
d.p("While the delegation is active, your delegate is notified of requests addressed to you and can approve, "
    "return or reject them. Every action they take is recorded under their own name. Click **Revoke** to end "
    "a delegation early. The panel also lists any authority others have delegated to you.")

# ------------------------------------------------------------------ 8 CICT
d.h1("CICT reviewers: technical review")
d.lead("CICT reviewers make sure every item is bought to an approved, supportable specification.")
d.h2("The review queue")
d.p("Open **CICT reviews**. The queue lists requests **With CICT** and those awaiting a clarification reply, "
    "with reference, title, unit, requester, submission date and status.")
d.h2("Reviewing a request")
d.steps([
    "Open the request and read the business case and items.",
    "For each item, check the recommended profile. Use **Approved specification profile** to choose a different profile for that category if needed.",
    "Record any **exception justification** when you approve something outside the standard profile for the user's level, and any reviewer note.",
    "Type a **Decision note** and choose a decision.",
])
d.table(["Decision", "What happens", "Note needed?"], [
    ("**Approve specification**", "Every item must have an approved profile. The request becomes **CICT approved**, the specification sheet becomes available and Procurement can start.", "Optional"),
    ("**Request clarification**", "The request goes to **Clarification needed** and the requester is asked your question.", "**Yes** — your question"),
    ("**Reject**", "The request is closed as **Rejected**.", "**Yes** — the reason"),
], [0.25, 0.53, 0.22])
d.callout("info", "When you approve, the system keeps a **snapshot** of the approved specification. Later changes to "
          "the profile do not alter what was approved for this request.")
d.h2("Maintaining specification standards")
d.p("Open **Standards** to manage the specification profiles used for recommendations and approvals.")
d.h3("Adding or editing a profile")
d.table(["Field", "What to enter"], [
    ("**Equipment category**", "The category the profile belongs to."),
    ("**Tier**", "Standard, Enhanced or Specialised."),
    ("**Profile name**", "For example \"Standard staff laptop\"."),
    ("**Summary**", "A one-line description of who it is for."),
    ("**Technical specification**", "One `Item: value` per line, for example `Processor: Intel Core i5 (current generation)`, `Memory: 16 GB`, `Storage: 512 GB SSD`."),
    ("**Suits position levels**", "Tick the position levels this profile is intended for. These drive the automatic recommendation."),
], [0.3, 0.7])
d.p("Click **Edit** on a profile card to change it. Click **Retire** to stop offering a profile while keeping it on "
    "past requests, and **Reinstate** to bring it back.")
d.p("Click **Delete** only for a profile created by mistake. The system refuses to delete a profile that any "
    "request uses and asks you to retire it instead.")

# ------------------------------------------------------------------ 9 procurement
d.h1("Procurement")
d.lead("Procurement turns an approved specification into a purchase. All work is done in the **Procurement "
       "pipeline** section of the request page.")
figure(d, pipeline([
    ("Add quotations", "one or more\nvendors"),
    ("Evaluate", "pass, or fail\nwith reason"),
    ("Record purchase", "from a passing\nquotation"),
    ("Stores", "receives\nthe goods"),
], height=58), "Figure 4 — Procurement's part of the process.")
d.h2("Your queue")
d.p("Open **Procurement** in the menu. It lists approved requests and those already in procurement, with the date "
    "last updated. Open a request and scroll to **Procurement pipeline**.")
d.h2("Adding quotations")
d.steps([
    "Enter the **Vendor name** and **Amount (ZMW)**.",
    "Add **Notes** if useful (delivery time, warranty, validity).",
    "Optionally attach the **Vendor's quote document** (PDF or image).",
    "Click **Add quotation**. Repeat for each vendor.",
])
d.p("When the first quotation is added, the status changes to **With procurement**. You can download any attached "
    "quote document from the quotation list.")
d.h2("Evaluating quotations")
d.p("For each quotation, record whether it meets the approved specification:")
d.bullets([
    "**Pass** — the quotation meets the specification and can be purchased.",
    "**Fail** — it does not. You must give the **reason** (for example \"Below spec: 8 GB memory offered, 16 GB required\").",
])
d.p("Each evaluation receives a reference such as `UNZA/CICT/EVAL/2026/0003`.")
d.h2("Recording the purchase")
d.steps([
    "Choose the **Passed quotation** you are buying from. Only quotations that passed evaluation are allowed.",
    "Enter the **PO number**, and confirm the **Vendor** and **Amount**.",
    "Add **Notes** if needed and click **Record purchase**.",
])
d.p("The status changes to **Purchased**, Stores is notified, and the **Purchase order** document becomes available.")
d.h2("When equipment must be returned")
d.p("If CICT Support finds the delivered equipment faulty or not to specification, the request shows **Return "
    "required** with their reason. Arrange the return with the supplier, then click **Restart procurement**. The "
    "request goes back to **With procurement** so you can record a new quotation and purchase.")

# ------------------------------------------------------------------ 10 stores
d.h1("Stores")
d.lead("Stores confirms that purchased goods have physically arrived.")
d.steps([
    "Open **Stores** in the menu. The queue lists purchased requests waiting for receipt.",
    "Open the request and check the delivery against the **Purchase order** and the specification sheet.",
    "In the **Procurement pipeline** section, enter **Condition notes** (for example \"3 laptops received in sealed boxes, good condition\").",
    "Click **Record receipt**.",
])
d.p("The status changes to **In stores**, CICT Support is notified, and the **Stores receipt** document becomes "
    "available to print and file.")
d.callout("tip", "Note any damage, shortages or wrong items in the condition notes. This record supports any later "
          "claim against the supplier.")

# ------------------------------------------------------------------ 11 support
d.h1("CICT Support: installation and verification")
d.lead("CICT Support installs the equipment and confirms that it works and matches the approved specification.")
d.steps([
    "Open **Verification** in the menu. The queue lists requests **In stores**.",
    "Collect the equipment, install and configure it, and check it against the **Specification sheet**.",
    "Open the request. In the **Procurement pipeline** section, choose the result.",
    "Add **Verification notes** and click **Record verification**.",
])
d.table(["Result", "What happens", "Notes needed?"], [
    ("**Pass**", "The request is **Completed**. The requester is notified and the **Verification certificate** becomes available.", "Optional"),
    ("**Needs return**", "The request becomes **Return required** and Procurement is asked to arrange a return and restart procurement.", "**Yes** — describe the fault or mismatch"),
], [0.2, 0.55, 0.25])
d.p("Each verification receives a certificate reference such as `UNZA/CICT/VERIFY/2026/0002`.")

# ------------------------------------------------------------------ 12 oversight
d.h1("Reports, directory and audit")
d.lead("Oversight pages are available to CICT, Procurement, Stores, CICT Support, Auditors and Administrators.")
d.h2("Reports")
d.p("Open **Reports** for a live summary of all requests:")
d.bullets([
    "**Total requests**, **Open** (awaiting a decision), **Approved specifications** and **Average turnaround** from submission to CICT decision.",
    "**By status** and **By priority** breakdowns.",
    "**Demand by organisational unit** — which schools and units are requesting the most.",
    "**Most recent requests**.",
])
d.h2("Staff directory")
d.p("**Directory** lists registered staff with their organisational unit, position level and system roles, and "
    "the organisational units. Use the search box to find a person by name, email, job title or unit.")
d.h2("Printing reports and registers")
d.bullets([
    "**Requests** page: set the filters, then **Print register** for a register of exactly those requests, or **Export CSV** to open them in Excel.",
    "**Reports** page: optionally choose *Raised from* and *Raised to*, then **Print report** for a Management Report covering that period.",
])
d.h2("Audit log")
d.p("Auditors and administrators open **Audit log** from the menu. It has two tabs.")
d.bullets([
    "**Activity log**: a permanent record of who did what, when and from which computer: sign-ins (including failed and blocked attempts), every request decision, procurement and stores records, configuration and role changes, attachments and documents printed. Filter by dates, category, user (name or email) or any text. Failed sign-ins and restores are highlighted. Use **Export CSV** or **Print / PDF** for an Audit Trail Report.",
    "**Request records**: every request with its decisions, filterable by status, unit or text, with **Export CSV** and **Print register**.",
])
d.callout("info", "Nobody can edit or delete audit entries, not even administrators. If the database is ever restored from a backup, the restore itself is recorded.")

# ------------------------------------------------------------------ 13 admin
d.h1("Administrators")
d.lead("Administration is available only to CICT administrators. It has seven tabs. The audit log has its own page (see Oversight).")
d.h2("Staff roles")
d.p("Search for a person by name or email. Each role appears as a button beside their name; click a role to "
    "give it, and click it again to remove it. Changes take effect immediately.")
d.callout("warning", "The **delete** (bin) button permanently removes a person's account, including the requests they "
          "raised. It cannot be undone, and you cannot delete your own account. Remove their roles instead if you "
          "only want to stop their access to work queues.")
d.h2("Organisational units")
d.bullets([
    "Add a unit with its **Code** (for example `SOE`), **Name**, **Type** (school, directorate, department, unit or centre) and **Campus**.",
    "Click **Edit** to correct a unit's details, then **Save changes** (or **Cancel**).",
    "Click **Retire** to hide a unit from new requests while keeping its history; **Restore** brings it back.",
])
d.h2("Equipment categories")
d.p("Add or edit the categories in the catalogue. Fields include code, name, icon, asset class, description, "
    "typical lifespan (years), warranty (months), indicative cost (ZMW), procurement lead time (days), the "
    "position levels eligible for the category, support notes, policy reference, and three requirements: "
    "**Requires CICT technical review**, **Requires a network port** and **Requires a software licence**.")
d.bullets([
    "The **indicative cost** is used to calculate the indicative value shown to requesters.",
    "Click **Retire** to withdraw a category from new requests; **Restore** to bring it back.",
    "**Delete** works only for a category no request uses and that has no specification profiles. Otherwise retire it.",
])
d.h2("Staff accounts")
d.p("Use **Provision a staff account** to create an account before the person signs in for the first time — for "
    "example to assign roles in advance. Enter their **Institutional email**, **Full name**, and optionally "
    "**Staff number** and **Job title**. They still sign in with their HR credentials.")
d.h2("Specification profiles")
d.p("The same profile management CICT reviewers have in **Standards** (Chapter 8), presented as a table: add, "
    "edit, retire, reinstate or delete profiles.")
d.h2("Lists")
d.p("Maintain the drop-down lists used across the system: designations, position levels, request types, "
    "business contexts, budget statuses, priorities, campuses, asset classes, software categories and "
    "specification tiers. Add entries, edit their labels and order, and deactivate entries that should no longer "
    "be offered.")
d.h2("Settings")
d.table(["Setting", "Effect"], [
    ("Organisation name", "Shown in the header and on document letterheads."),
    ("Unit name", "Shown beside the organisation name."),
    ("Support email", "The contact address on the sign-in and help pages."),
    ("Declaration text", "The statement requesters must accept before submitting."),
    ("Manager SLA days / CICT SLA days", "The turnaround targets shown to users."),
], [0.35, 0.65])


# ------------------------------------------------------------------ 14 help
d.h1("Frequently asked questions")
faqs = [
    ("Why can I not create an account?", "Accounts come from the University HR system. Sign in with your HR credentials. If that fails, ask HR to confirm your record is active."),
    ("My name, job title or department is wrong.", "These details come from HR. Ask HR to correct your record; your profile updates automatically the next time you sign in."),
    ("Can I request equipment outside the standard profiles?", "Yes. Explain the requirement in the item's proposed specification and your justification. CICT records any approved exception with its justification on the specification sheet."),
    ("Who chooses the supplier and price?", "Procurement, under University procurement rules. CICT issues the technical specification only."),
    ("I chose the wrong manager.", "If the request is still awaiting the manager, ask that manager to **Return for correction**, then change the manager and resubmit. Otherwise withdraw and submit a new request."),
    ("Can I change a request after submitting it?", "Not directly. Ask your manager to return it for correction, or withdraw it and submit a new one."),
    ("I am going on leave and approve requests.", "Delegate your authority from your profile page (Chapter 7)."),
    ("Where is the specification sheet?", "On the request page, once CICT has approved it: click **Specification sheet**."),
    ("I do not see a menu item a colleague has.", "Menu items depend on roles. Ask a CICT administrator if you need an additional role."),
    ("The page shows \"Restricted\".", "That page belongs to a role you do not hold."),
]
for q, a in faqs:
    d.keep(60)
    d.h3(q)
    d.p(a)
d.h2("Getting help")
d.p("Contact the **CICT service desk** at the Great East Road campus or by email at **cictsupport@unza.ac.zm** (the "
    "current address is also shown on the sign-in and Help pages). Always include your **request reference** so "
    "the enquiry can be traced.")
d.h2("Glossary")
d.table(["Term", "Meaning"], [
    ("Approving manager", "The person you choose to confirm the business need, normally your head of unit."),
    ("Audit trail", "The list of every action taken on a request."),
    ("Catalogue", "The list of equipment categories and their standard specifications."),
    ("Delegation", "Temporary transfer of a manager's approval authority to a colleague."),
    ("Draft", "A request that has been saved but not submitted."),
    ("Indicative value", "An estimated cost based on published unit costs; not a quotation."),
    ("Position level", "Your grade as recorded in HR, used to recommend a specification."),
    ("Reference", "The unique number of a request, such as 202610130001."),
    ("Specification profile", "A CICT-approved minimum technical specification for a category of equipment."),
    ("Tier", "Standard, Enhanced or Specialised — the level of a specification profile."),
], [0.27, 0.73])

d.build()
print("ok")
