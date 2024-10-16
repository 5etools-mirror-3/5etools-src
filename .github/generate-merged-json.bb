(require '[babashka.fs :as fs])

(defn- list-jsons []
  (fs/glob "sns" "*.json"))

(def merge-data (partial
                  merge-with
                  (fn concat-merge [left right]
                    (cond
                      (vector? left) (into left right)
                      (map? left) (merge-with concat-merge left right)
                      :else right))))

(defn- merge-jsons []
  (transduce (map (comp json/parse-stream io/reader fs/file))
             merge-data
             (list-jsons)))

(-> (merge-jsons)
    (update-in ["_meta" "sources"] set)
    json/generate-string
    (->> (spit (str "homebrew/sns.json"))))
