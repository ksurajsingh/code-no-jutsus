-- Students Table
CREATE TABLE Students (
    student_id VARCHAR(255) PRIMARY KEY, -- Campus Gmail as unique ID
    name VARCHAR(255) NOT NULL,
    department VARCHAR(100),
    current_status TEXT,
    work_experience TEXT,
    cgpa DECIMAL(3, 2),
    skills JSON, -- Store as JSON array for flexibility
    resume_link VARCHAR(255), -- URL to PDF
    portfolio_links JSON, -- Store as JSON array of URLs
    total_upvotes_received INT DEFAULT 0,
    aicte_points INT DEFAULT 0,
    rs_points INT DEFAULT 0
);

-- Comments Table
CREATE TABLE Comments (
    comment_id INT AUTO_INCREMENT PRIMARY KEY,
    student_id VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    upvote_count INT DEFAULT 0,
    FOREIGN KEY (student_id) REFERENCES Students(student_id)
);

-- Upvote_Activity Table
CREATE TABLE Upvote_Activity (
    upvote_id INT AUTO_INCREMENT PRIMARY KEY,
    comment_id INT NOT NULL,
    upvoter_student_id VARCHAR(255) NOT NULL, -- The student who cast the upvote
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (comment_id) REFERENCES Comments(comment_id),
    FOREIGN KEY (upvoter_student_id) REFERENCES Students(student_id),
    UNIQUE (comment_id, upvoter_student_id) -- Ensures a student can only upvote a comment once
);
