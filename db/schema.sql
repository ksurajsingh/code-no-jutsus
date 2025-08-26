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

-- Comments Table (This represents a doubt thread post or an answer/comment within a thread)
CREATE TABLE Comments (
    comment_id INT AUTO_INCREMENT PRIMARY KEY,
    student_id VARCHAR(255) NOT NULL,
    parent_comment_id INT DEFAULT NULL, -- For replies, references the parent comment
    content TEXT NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    upvote_count INT DEFAULT 0,
    FOREIGN KEY (student_id) REFERENCES Students(student_id),
    FOREIGN KEY (parent_comment_id) REFERENCES Comments(comment_id) -- Self-referencing for threaded comments
);

-- Upvote_Activity Table
CREATE TABLE Upvote_Activity (
    upvote_id INT AUTO_INCREMENT PRIMARY KEY,
    comment_id INT NOT NULL,
    upvoter_student_id VARCHAR(255) NOT NULL, -- The student who cast the upvote
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (comment_id) REFERENCES Comments(comment_id),
    FOREIGN KEY (upvoter_student_id) REFERENCES Students(student_id),
    UNIQUE (comment_id, upvoter_student_id)
);

-- Tags Table (e.g., 'CSE', 'EEE', 'Python', 'React', 'Calculus', 'Job Search')
CREATE TABLE Tags (
    tag_id INT AUTO_INCREMENT PRIMARY KEY,
    tag_name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT
);

-- Comment_Tags Table (Many-to-many relationship between Comments and Tags)
CREATE TABLE Comment_Tags (
    comment_id INT NOT NULL,
    tag_id INT NOT NULL,
    PRIMARY KEY (comment_id, tag_id), -- A comment can have multiple tags, a tag can be on multiple comments
    FOREIGN KEY (comment_id) REFERENCES Comments(comment_id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES Tags(tag_id) ON DELETE CASCADE
);
