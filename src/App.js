import "./App.css";
import Message from "./Components/Message.jsx";
import {
  GoogleAuthProvider,
  signInWithPopup,
  getAuth,
  onAuthStateChanged,
  signOut,
} from "firebase/auth";
import {
  getFirestore,
  addDoc,
  deleteDoc,
  where,
  getDocs,
  collection,
  serverTimestamp,
  onSnapshot,
  query,
  orderBy,
} from "firebase/firestore";
import {
  Box,
  Button,
  Container,
  VStack,
  Input,
  HStack,
} from "@chakra-ui/react";
import { app } from "../src/firebase.js";
import { useEffect, useState, useRef } from "react";

const auth = getAuth(app);
const db = getFirestore(app);

const loginHandler = () => {
  const provider = new GoogleAuthProvider();

  signInWithPopup(auth, provider);
};

// const logoutHandler = () => {
//   signOut(auth);
// };

function App() {
  const [user, setUser] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);

  const divForScroll = useRef(null);

  const submitHandler = async (e) => {
    e.preventDefault();

    try {
      setMessage("");
      await addDoc(collection(db, "messages"), {
        text: message,
        uid: user.uid,
        uri: user.photoURL,
        createdAt: serverTimestamp(),
      });
      divForScroll.current.scrollIntoView({ behaviour: "smooth" });
    } catch (error) {
      alert(error);
    }
  };
  const logoutHandler = () => {
    // Check if a user is logged in before logging out
    if (user) {
      // Delete user's messages when they log out
      const userMessagesQuery = query(
        collection(db, "messages"),
        where("uid", "==", user.uid)
      );

      getDocs(userMessagesQuery).then((querySnapshot) => {
        querySnapshot.forEach((doc) => {
          deleteDoc(doc.ref);
        });
      });
    }

    // Log out the user
    signOut(auth);
  };
  useEffect(() => {
    const q = query(collection(db, "messages"), orderBy("createdAt", "asc"));

    const unsubscribe = onAuthStateChanged(auth, (data) => {
      setUser(data);
    });

    const unsubscribeMessage = onSnapshot(q, (snap) => {
      setMessages(
        snap.docs.map((item) => {
          const id = item.id;
          return { id, ...item.data() };
        })
      );
    });

    return () => {
      unsubscribe();
      unsubscribeMessage();
    };
  }, []);
  return (
    <Box bg={"blackAlpha.500"}>
      {user ? (
        <Container bg={"white"} h={"100vh"}>
          <VStack bg={"blue.200"} h={"full"} padding={"2"}>
            <Button colorScheme="red" onClick={logoutHandler} w={"full"}>
              Logout
            </Button>
            <VStack
              h="full"
              w={"full"}
              borderRadius={"20"}
              bg={"whatsapp.100"}
              overflowY={"auto"}
              css={{
                "&::-webkit-scrollbar": {
                  display: "none",
                },
              }}
            >
              {messages &&
                messages.map((item) => (
                  <Message
                    key={item.id}
                    user={item.uid === user.uid ? "me" : "other"}
                    text={item.text}
                    uri={item.uri}
                  />
                ))}
              <div ref={divForScroll}></div>
            </VStack>

            <form onSubmit={submitHandler} style={{ width: "100%" }}>
              <HStack>
                <Input
                  w={"full"}
                  value={message}
                  placeholder="Enter Your message here..."
                  onChange={(e) => setMessage(e.target.value)}
                />
                <Button type="submit" colorScheme="green">
                  Send
                </Button>
              </HStack>
            </form>
          </VStack>
        </Container>
      ) : (
        <VStack h={"100vh"} justifyContent={"center"} bg={"white"}>
          <Button onClick={loginHandler} bg={"purple.100"}>
            Sign In With Google
          </Button>
        </VStack>
      )}
    </Box>
  );
}

export default App;
