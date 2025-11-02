import React from 'react';
import {ThreadsList} from "@/components/Comment/ThreadsList";

interface VersionHtmlProps {
  setShowUnresolved: (resolved : boolean) => void;
  showUnresolved: boolean;
  provider: any;
  filteredThreads: any;
}

const VersionHtml: React.FC<VersionHtmlProps> = ({
                                                   setShowUnresolved,
                                                   showUnresolved,
                                                   provider,
                                                   filteredThreads
                                                 }) => (
  <div className="sidebar-options">
    <div className="option-group">
      <div className="label-large">Comments</div>
      <div className="switch-group">
        <label>
          <input
            type="radio"
            name="thread-state"
            onChange={() => setShowUnresolved(true)}
            checked={showUnresolved}
          />
          Open
        </label>
        <label>
          <input
            type="radio"
            name="thread-state"
            onChange={() => setShowUnresolved(false)}
            checked={!showUnresolved}
          />
          Resolved
        </label>
      </div>
    </div>
    <ThreadsList provider={provider} threads={filteredThreads} />
  </div>
);

export default VersionHtml;
