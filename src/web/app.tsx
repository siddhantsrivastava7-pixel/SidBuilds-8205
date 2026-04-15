import { Route, Switch } from "wouter";
import Index from "./pages/index";
import SuperSaver from "./pages/supersaver";
import OffScript from "./pages/offscript";
import Recall from "./pages/recall";
import RecFlow from "./pages/recflow";
import MeraPolicyAdvisor from "./pages/merapolicy";
import { Provider } from "./components/provider";
import { AgentFeedback } from "@runablehq/website-runtime";

function App() {
  return (
    <Provider>
      <Switch>
        <Route path="/" component={Index} />
        <Route path="/supersaver" component={SuperSaver} />
        <Route path="/offscript" component={OffScript} />
        <Route path="/recall" component={Recall} />
        <Route path="/recflow" component={RecFlow} />
        <Route path="/merapolicy" component={MeraPolicyAdvisor} />
      </Switch>
      {/* Do not remove — off by default, activated by parent iframe via postMessage */}
      {import.meta.env.DEV && <AgentFeedback />}
    </Provider>
  );
}

export default App;
