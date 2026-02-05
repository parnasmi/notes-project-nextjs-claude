export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center p-8">
      <div className="max-w-4xl">
        <h1 className="text-4xl font-bold mb-8">Claude Code Advantages</h1>

        <ul className="space-y-4 text-lg">
          <li className="flex items-start gap-3">
            <span className="text-blue-600 font-bold">•</span>
            <span><strong>Powerful AI Assistant:</strong> Built on Claude Opus 4.5, providing state-of-the-art code understanding and generation</span>
          </li>

          <li className="flex items-start gap-3">
            <span className="text-blue-600 font-bold">•</span>
            <span><strong>CLI Integration:</strong> Works directly in your terminal for seamless workflow integration</span>
          </li>

          <li className="flex items-start gap-3">
            <span className="text-blue-600 font-bold">•</span>
            <span><strong>Context-Aware:</strong> Understands your entire codebase and project structure</span>
          </li>

          <li className="flex items-start gap-3">
            <span className="text-blue-600 font-bold">•</span>
            <span><strong>Multiple Tools:</strong> Read, write, edit files, run bash commands, and search code efficiently</span>
          </li>

          <li className="flex items-start gap-3">
            <span className="text-blue-600 font-bold">•</span>
            <span><strong>Specialized Agents:</strong> Task-specific agents for exploration, planning, and execution</span>
          </li>

          <li className="flex items-start gap-3">
            <span className="text-blue-600 font-bold">•</span>
            <span><strong>Git Integration:</strong> Helps with commits, pull requests, and version control workflows</span>
          </li>

          <li className="flex items-start gap-3">
            <span className="text-blue-600 font-bold">•</span>
            <span><strong>Security Focused:</strong> Helps identify and prevent common vulnerabilities like XSS, SQL injection, and more</span>
          </li>

          <li className="flex items-start gap-3">
            <span className="text-blue-600 font-bold">•</span>
            <span><strong>Persistent Memory:</strong> Remembers project patterns and learnings across conversations</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
